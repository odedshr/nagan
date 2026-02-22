use std::fs::File;
use std::path::Path;

use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::errors::Error as SymphoniaError;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;

/// Estimate BPM from the audio signal (not from tags/metadata).
///
/// Returns `Ok(None)` when the file is too short or tempo can't be determined reliably.
pub fn estimate_bpm_from_file(file_path: &str) -> Result<Option<f32>, String> {
    let path = Path::new(file_path);
    let file = File::open(path).map_err(|e| format!("Failed to open file '{}': {}", file_path, e))?;

    let mss = MediaSourceStream::new(Box::new(file), Default::default());

    let mut hint = Hint::new();
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        hint.with_extension(ext);
    }

    let probed = symphonia::default::get_probe()
        .format(
            &hint,
            mss,
            &FormatOptions::default(),
            &MetadataOptions::default(),
        )
        .map_err(|e| format!("Failed to probe format for '{}': {}", file_path, e))?;

    let mut format = probed.format;

    let track = format
        .default_track()
        .ok_or_else(|| format!("No default audio track found in '{}'", file_path))?
        .clone();

    let sample_rate = track
        .codec_params
        .sample_rate
        .ok_or_else(|| "Missing sample rate in codec params".to_string())? as usize;

    let mut decoder = symphonia::default::get_codecs()
        .make(&track.codec_params, &DecoderOptions::default())
        .map_err(|e| format!("Failed to create decoder: {}", e))?;

    // Read up to N seconds to keep this reasonably fast.
    const MAX_SECONDS: usize = 90;
    let max_samples = sample_rate.saturating_mul(MAX_SECONDS);

    let mut mono_samples: Vec<f32> = Vec::with_capacity(sample_rate.saturating_mul(30));

    loop {
        let packet = match format.next_packet() {
            Ok(packet) => packet,
            Err(SymphoniaError::IoError(_)) => break,
            Err(SymphoniaError::ResetRequired) => {
                return Err("Decoder reset required; unsupported stream".to_string())
            }
            Err(e) => return Err(format!("Failed to read packet: {}", e)),
        };

        if packet.track_id() != track.id {
            continue;
        }

        let decoded = match decoder.decode(&packet) {
            Ok(decoded) => decoded,
            Err(SymphoniaError::IoError(_)) => break,
            Err(SymphoniaError::DecodeError(_)) => continue,
            Err(e) => return Err(format!("Decode error: {}", e)),
        };

        let spec = *decoded.spec();
        let frames = decoded.frames();
        let channels = spec.channels.count().max(1);

        // Convert to f32 via SampleBuffer.
        let mut sample_buf = SampleBuffer::<f32>::new(decoded.capacity() as u64, spec);
        sample_buf.copy_interleaved_ref(decoded);
        let data = sample_buf.samples();

        for frame in 0..frames {
            let mut sum = 0.0f32;
            for ch in 0..channels {
                sum += data[frame * channels + ch];
            }
            mono_samples.push(sum / channels as f32);
            if mono_samples.len() >= max_samples {
                break;
            }
        }

        if mono_samples.len() >= max_samples {
            break;
        }
    }

    estimate_bpm_from_samples(&mono_samples, sample_rate)
}

fn estimate_bpm_from_samples(samples: &[f32], sample_rate: usize) -> Result<Option<f32>, String> {
    // Need some minimum duration for meaningful estimation.
    const MIN_SECONDS: f32 = 8.0;
    if samples.len() < (sample_rate as f32 * MIN_SECONDS) as usize {
        return Ok(None);
    }

    // Envelope hop size.
    const HOP: usize = 1024;

    let frame_rate = sample_rate as f32 / HOP as f32;

    // Compute a simple energy envelope (mean absolute value per hop).
    let mut envelope: Vec<f32> = Vec::with_capacity(samples.len() / HOP);
    for chunk in samples.chunks(HOP) {
        let mut sum = 0.0f32;
        for &x in chunk {
            sum += x.abs();
        }
        envelope.push(sum / chunk.len() as f32);
    }

    // Smooth envelope with a short moving average.
    let envelope = moving_average(&envelope, 4);

    // Onset strength: positive differences.
    let mut onset: Vec<f32> = Vec::with_capacity(envelope.len().saturating_sub(1));
    for i in 1..envelope.len() {
        let diff = envelope[i] - envelope[i - 1];
        onset.push(if diff > 0.0 { diff } else { 0.0 });
    }

    // Normalize onset.
    let max_val = onset
        .iter()
        .cloned()
        .fold(0.0f32, |a, b| if b > a { b } else { a });
    if max_val <= 0.0 {
        return Ok(None);
    }
    for v in &mut onset {
        *v /= max_val;
    }

    // Autocorrelation across a plausible tempo range.
    let bpm_min = 60.0f32;
    let bpm_max = 200.0f32;

    let lag_min = ((frame_rate * 60.0) / bpm_max).round().max(1.0) as usize;
    let lag_max = ((frame_rate * 60.0) / bpm_min).round().max(lag_min as f32) as usize;

    if onset.len() <= lag_max + 1 {
        return Ok(None);
    }

    let mut best_lag = 0usize;
    let mut best_score = -1.0f32;

    for lag in lag_min..=lag_max {
        let mut score = 0.0f32;
        for i in lag..onset.len() {
            score += onset[i] * onset[i - lag];
        }

        if score > best_score {
            best_score = score;
            best_lag = lag;
        }
    }

    if best_lag == 0 || best_score <= 0.0 {
        return Ok(None);
    }

    let mut bpm = (60.0 * frame_rate) / best_lag as f32;

    // Fold to the target range by doubling/halving.
    while bpm < bpm_min {
        bpm *= 2.0;
    }
    while bpm > bpm_max {
        bpm /= 2.0;
    }

    Ok(Some(bpm))
}

fn moving_average(values: &[f32], window: usize) -> Vec<f32> {
    if window <= 1 || values.is_empty() {
        return values.to_vec();
    }

    let mut out = Vec::with_capacity(values.len());
    for i in 0..values.len() {
        let start = i.saturating_sub(window - 1);
        let mut sum = 0.0f32;
        let mut count = 0usize;
        for j in start..=i {
            sum += values[j];
            count += 1;
        }
        out.push(sum / count as f32);
    }
    out
}
