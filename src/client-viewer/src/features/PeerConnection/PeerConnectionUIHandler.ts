import {
	ErrorMessage,
	type ErrorMessageType,
} from '../../components/ErrorDialog/ErrorMessageEnum';

import type { RemoteControlCapabilityPayload } from '../../../../common/RemoteInputTypes';

export default class PeerConnectionUIHandler {
	setMyDeviceDetails: (details: DeviceDetails) => void;

	hostAllowedToConnectCallback: () => void;

	setScreenSharingSourceTypeCallback: (s: ScreenSharingSourceType) => void;

	setRemoteControlCapabilityCallback: (
		capability: RemoteControlCapabilityPayload,
	) => void;

	setAppLanguageCallback: (newLang: string) => void;

	setDialogErrorMessageCallback: (message: ErrorMessageType) => void;

	setIsErrorDialogOpen: (val: boolean) => void;

	errorDialogMessage: ErrorMessageType = ErrorMessage.UNKNOWN_ERROR;

	constructor(
		setMyDeviceDetails: (details: DeviceDetails) => void,
		hostAllowedToConnectCallback: () => void,
		setScreenSharingSourceTypeCallback: (s: ScreenSharingSourceType) => void,
		setRemoteControlCapabilityCallback: (
			capability: RemoteControlCapabilityPayload,
		) => void,
		setAppLanguageCallback: (newLang: string) => void,
		setDialogErrorMessageCallback: (message: ErrorMessageType) => void,
		setIsErrorDialogOpen: (val: boolean) => void,
	) {
		this.hostAllowedToConnectCallback = hostAllowedToConnectCallback;
		this.setMyDeviceDetails = setMyDeviceDetails;
		this.setScreenSharingSourceTypeCallback =
			setScreenSharingSourceTypeCallback;
		this.setRemoteControlCapabilityCallback =
			setRemoteControlCapabilityCallback;
		this.setAppLanguageCallback = setAppLanguageCallback;
		this.setDialogErrorMessageCallback = setDialogErrorMessageCallback;
		this.setIsErrorDialogOpen = setIsErrorDialogOpen;
	}
}
