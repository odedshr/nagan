export default function selectFile(): Promise<File[]> {
    return new Promise<File[]>((resolve) => {
        const fileSelect = document.createElement('input');
        fileSelect.type = 'file';
        fileSelect.accept = 'audio/*';
        fileSelect.style.display = 'none';
        fileSelect.addEventListener("change", 
            () =>  { resolve(fileSelect.files!==null ?
                [...fileSelect.files] as File[] : 
                []);
            }
        );
        fileSelect.click(); // Programmatically open the file dialog
    });

}