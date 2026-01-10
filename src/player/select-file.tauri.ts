import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from "@tauri-apps/plugin-fs";

export default async function selectFile(): Promise<File[]> {
    return new Promise (async resolve => {
        const filePathnames = await open({
            multiple: true,
            filters: [{
                name: 'Audio Files',
                extensions: ['mp3', 'flac', 'wav', 'm4a', 'ogg', 'aac', 'wma']
            }]
        });
        if (filePathnames) {
            const files = filePathnames?.map(async (path:string) => {
                const bytes = await readFile(path);
                return new File([bytes], path);
            });
            resolve(await Promise.all(files));
        } else {
            resolve([]);
        }
    });

}