export default (url: MediaStream | null) => {
	return () => {
		if (url === null) {
			return;
		}
		setTimeout(() => {
			const reveal = document.querySelector('.container > .react-reveal');
			if (reveal instanceof HTMLElement) {
				reveal.style.display = 'none';
			}
		}, 1000);
	};
};
