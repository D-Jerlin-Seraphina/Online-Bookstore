export const fileToDataUrl = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result === 'string') {
				resolve(result);
			} else {
				reject(new Error('Unexpected file reader result'));
			}
		};
		reader.onerror = () => {
			reject(reader.error ?? new Error('Unable to read file'));
		};
		reader.readAsDataURL(file);
	});
