export function prepareDataMessageToChangeQuality(q: number) {
	return `
    {
      "type": "set_video_quality",
      "payload": {
        "value": ${q}
      }
    }
  `;
}

export function prepareDataMessageToGetSharingSourceType() {
	return `
    {
      "type": "get_sharing_source_type",
      "payload": {
      }
    }
  `;
}

export function prepareDataMessageToGetRemoteControlCapability() {
	return JSON.stringify({
		type: 'get_remote_control_capability',
		payload: {},
	});
}

export function prepareRemoteInputMessage(payload: {
	action: 'click' | 'scroll';
	x: number;
	y: number;
	button?: 'left';
	deltaY?: number;
}) {
	return JSON.stringify({
		type: 'remote_input',
		payload,
	});
}
