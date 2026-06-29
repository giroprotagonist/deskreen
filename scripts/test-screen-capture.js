const { app, desktopCapturer, systemPreferences } = require('electron');

app.whenReady().then(async () => {
	const perm = systemPreferences.getMediaAccessStatus('screen');
	console.log('screen-permission:', perm);
	try {
		const sources = await desktopCapturer.getSources({
			types: ['screen', 'window'],
			thumbnailSize: { width: 100, height: 100 },
		});
		console.log('sources-count:', sources.length);
		for (const source of sources.slice(0, 5)) {
			console.log('source:', source.name, source.id);
		}
	} catch (error) {
		console.log('getSources-error:', error);
		console.log('error-type:', Object.prototype.toString.call(error));
	}
	app.exit(0);
});
