import { useCallback, useEffect, useState } from 'react';
import { H3, Dialog, Button, Spinner, Callout, Text } from '@blueprintjs/core';
import { Row, Col } from 'react-flexbox-grid';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import CloseOverlayButton from '../../CloseOverlayButton';
import PreviewGridList from './PreviewGridList';
import { IpcEvents } from '../../../../../common/IpcEvents.enum';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles(() =>
	createStyles({
		dialogRoot: {
			width: '90%',
			height: '87vh !important',
			overflowY: 'scroll',
		},
		closeButton: {
			position: 'relative',
			width: '40px',
			height: '40px',
			left: 'calc(100% - 55px)',
			borderRadius: '100px',
			zIndex: 9999,
		},
		overlayInnerRoot: { width: '90%', height: '90%' },
		sharePreviewsContainer: {
			top: '60px',
			position: 'relative',
			height: '100%',
		},
		emptyState: {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			height: '100%',
			padding: '24px',
			textAlign: 'center',
			gap: '16px',
		},
	}),
);

interface DesktopSharingSourcesResponse {
	ids: string[];
	screenCaptureStatus?: string;
	captureWorking?: boolean;
	error?: string;
}

interface ChooseAppOrScreenOverlayProps {
	isEntireScreenToShareChosen: boolean;
	isChooseAppOrScreenOverlayOpen: boolean;
	handleNextEntireScreen: () => void;
	handleNextApplicationWindow: () => void;
	handleClose: () => void;
	isWaylandSession: boolean;
}

export default function ChooseAppOrScreenOverlay(
	props: ChooseAppOrScreenOverlayProps,
) {
	const {
		handleClose,
		isChooseAppOrScreenOverlayOpen,
		isEntireScreenToShareChosen,
		handleNextEntireScreen,
		handleNextApplicationWindow,
		isWaylandSession,
	} = props;
	const classes = useStyles();
	const { t } = useTranslation();

	const [viewSharingIds, setViewSharingIds] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [screenCaptureStatus, setScreenCaptureStatus] = useState<string>('');
	const [captureWorking, setCaptureWorking] = useState<boolean | null>(null);
	const [loadError, setLoadError] = useState<string>('');

	const handleRefreshSources = useCallback(async (): Promise<{
		ids: string[];
		permissionStatus: string;
	}> => {
		if (isWaylandSession) {
			setViewSharingIds([]);
			setLoadError('');
			return { ids: [], permissionStatus: '' };
		}
		try {
			const response = (await window.electron.ipcRenderer.invoke(
				IpcEvents.GetDesktopSharingSourceIds,
				{
					isEntireScreenToShareChosen,
				},
			)) as DesktopSharingSourcesResponse | string[];

			const ids = Array.isArray(response) ? response : response.ids;
			const status = Array.isArray(response)
				? ''
				: (response.screenCaptureStatus ?? '');
			const error = Array.isArray(response) ? '' : (response.error ?? '');
			const working = Array.isArray(response)
				? ids.length > 0
				: (response.captureWorking ?? ids.length > 0);

			setViewSharingIds(ids);
			setScreenCaptureStatus(status);
			setCaptureWorking(working);
			setLoadError(error);
			return { ids, permissionStatus: status };
		} catch (e) {
			const message =
				e instanceof Error ? e.message : t('failed-to-load-sharing-sources');
			setViewSharingIds([]);
			setLoadError(message);
			return { ids: [], permissionStatus: '' };
		}
	}, [isEntireScreenToShareChosen, isWaylandSession, t]);

	const handleRefreshSourcesWithLoading = useCallback(async (): Promise<
		string[]
	> => {
		setIsLoading(true);
		try {
			const { ids } = await handleRefreshSources();
			return ids;
		} finally {
			setIsLoading(false);
		}
	}, [handleRefreshSources]);

	const handleOpenScreenCaptureSettings = useCallback(() => {
		void window.electron.ipcRenderer.invoke(IpcEvents.OpenScreenCaptureSettings);
	}, []);

	useEffect(() => {
		if (!isChooseAppOrScreenOverlayOpen || isWaylandSession) {
			setIsLoading(false);
			setViewSharingIds([]);
			setLoadError('');
			setScreenCaptureStatus('');
			setCaptureWorking(null);
			return;
		}

		let cancelled = false;
		let attempts = 0;
		const maxAttempts = 20;
		const retryDelayMs = 500;

		setIsLoading(true);

		const attemptLoad = async () => {
			const { ids, permissionStatus } = await handleRefreshSources();
			if (cancelled) return;
			if (
				ids.length > 0 ||
				attempts >= maxAttempts ||
				permissionStatus === 'denied' ||
				permissionStatus === 'restricted'
			) {
				setIsLoading(false);
				return;
			}
			attempts += 1;
			setTimeout(() => {
				if (!cancelled) {
					attemptLoad();
				}
			}, retryDelayMs);
		};

		attemptLoad();

		return () => {
			cancelled = true;
			setIsLoading(false);
		};
	}, [isChooseAppOrScreenOverlayOpen, handleRefreshSources, isWaylandSession]);

	const needsScreenCapturePermission =
		screenCaptureStatus === 'denied' && captureWorking === false;

	const needsAppRestart =
		screenCaptureStatus !== 'denied' &&
		captureWorking === false &&
		viewSharingIds.length === 0;

	const renderEmptyState = () => {
		if (viewSharingIds.length > 0) {
			return null;
		}

		return (
			<div className={classes.emptyState}>
				{needsScreenCapturePermission ? (
					<Callout intent="warning" title={t('screen-recording-permission-required')}>
						<Text>{t('screen-recording-permission-instructions')}</Text>
						<div style={{ marginTop: '12px' }}>
							<Button intent="primary" onClick={handleOpenScreenCaptureSettings}>
								{t('open-screen-recording-settings')}
							</Button>
						</div>
					</Callout>
				) : needsAppRestart ? (
					<Callout intent="warning" title={t('screen-recording-restart-required')}>
						<Text>{t('screen-recording-restart-instructions')}</Text>
					</Callout>
				) : (
					<Callout intent="primary" title={t('no-sharing-sources-found')}>
						<Text>
							{isEntireScreenToShareChosen
								? t('no-screens-found-instructions')
								: t('no-windows-found-instructions')}
						</Text>
					</Callout>
				)}
				{loadError ? (
					<Text className="bp3-text-muted">{loadError}</Text>
				) : null}
				<Button icon="refresh" intent="warning" onClick={handleRefreshSourcesWithLoading}>
					{t('refresh')}
				</Button>
			</div>
		);
	};

	return (
		<Dialog
			onClose={handleClose}
			className={`${classes.dialogRoot} choose-app-or-screen-dialog`}
			autoFocus
			canEscapeKeyClose
			canOutsideClickClose
			enforceFocus
			isOpen={isChooseAppOrScreenOverlayOpen}
			usePortal
			transitionDuration={0}
			style={{
				borderRadius: '8px',
			}}
		>
			<div
				id="choose-app-or-screen-overlay-container"
				style={{ minHeight: '95%', overflowX: 'hidden' }}
			>
				<div
					style={{
						position: 'fixed',
						zIndex: 99999,
						width: '90%',
						paddingTop: '0px',
						paddingLeft: '15px',
						paddingRight: '15px',
					}}
				>
					<div
						style={{
							padding: '10px',
							borderRadius: '5px',
							height: '60px',
							width: '100%',
						}}
					>
						<Row
							between="xs"
							middle="xs"
							style={{
								width: '100%',
								backgroundColor: '#f6f7f9',
								borderRadius: '8px',
							}}
						>
							<Col xs={9}>
								{isEntireScreenToShareChosen ? (
									<div>
										<H3 style={{ marginBottom: '0px' }}>
											{t('select-entire-screen-to-share')}
										</H3>
									</div>
								) : (
									<div>
										<H3 style={{ marginBottom: '0px' }}>
											{t('select-app-window-to-share')}
										</H3>
									</div>
								)}
							</Col>
							<Col xs={2}>
								<Button
									icon="refresh"
									intent="warning"
									onClick={handleRefreshSourcesWithLoading}
									disabled={isLoading}
									style={{
										borderRadius: '100px',
										width: 'max-content',
									}}
								>
									{t('refresh')}
								</Button>
							</Col>

							<Col xs={1}>
								<CloseOverlayButton
									onClick={handleClose}
									style={{
										borderRadius: '100px',
										width: '40px',
										height: '40px',
									}}
								/>
							</Col>
						</Row>
					</div>
				</div>

				<div
					style={{
						position: 'relative',
						zIndex: '1',
						height: 'calc(87vh - 80px)',
						minHeight: '400px',
					}}
				>
					{isLoading ? (
						<div
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								width: '100%',
								height: '100%',
							}}
						>
							<Spinner size={60} />
						</div>
					) : (
						<div
							style={{
								position: 'relative',
								height: '100%',
							}}
						>
							{viewSharingIds.length > 0 ? (
								<Row>
									<div className={classes.sharePreviewsContainer}>
										<PreviewGridList
											viewSharingIds={viewSharingIds}
											isEntireScreen={isEntireScreenToShareChosen}
											handleNextEntireScreen={() => {
												handleNextEntireScreen();
												handleClose();
											}}
											handleNextApplicationWindow={() => {
												handleNextApplicationWindow();
												handleClose();
											}}
										/>
									</div>
								</Row>
							) : (
								renderEmptyState()
							)}
						</div>
					)}
				</div>
			</div>
		</Dialog>
	);
}
