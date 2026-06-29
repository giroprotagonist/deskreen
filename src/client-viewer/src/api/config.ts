const host = window.location.hostname;
const protocol = window.location.protocol.replace(':', '') || 'http';
const port = window.location.port || '3131';

export default {
	host,
	port,
	protocol,
};
