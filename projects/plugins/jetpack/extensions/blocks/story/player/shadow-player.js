/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ShadowRoot from './lib/shadow-root';
import * as fullscreenAPI from './lib/fullscreen-api';
import Modal from './modal';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
	window.navigator.userAgent
);

export default function ShadowPlayer( {
	className,
	fullscreenClassName,
	bodyFullscreenClassName,
	fullscreen,
	shadowDOM,
	onKeyDown,
	onExitFullscreen,
	children,
} ) {
	const rootElementRef = useRef();
	const [ lastScrollPosition, setLastScrollPosition ] = useState( null );
	const shouldUseFullscreenAPI = isMobile && fullscreenAPI.enabled();
	const isFullPageModalOpened = fullscreen && ! shouldUseFullscreenAPI;
	const isFullscreen = fullscreen && shouldUseFullscreenAPI;

	useLayoutEffect( () => {
		if ( shouldUseFullscreenAPI ) {
			if ( fullscreen ) {
				if ( rootElementRef.current ) {
					fullscreenAPI.launch( rootElementRef.current, onExitFullscreen );
				}
			} else if ( fullscreenAPI.element() ) {
				fullscreenAPI.exit();
			}
			return;
		}
		if ( fullscreen ) {
			// position: fixed does not work as expected on mobile safari
			// To fix that we need to add a fixed positioning to body,
			// retain the current scroll position and restore it when we exit fullscreen
			setLastScrollPosition( [
				document.documentElement.scrollLeft,
				document.documentElement.scrollTop,
			] );
			document.body.classList.add( bodyFullscreenClassName );
			document.getElementsByTagName( 'html' )[ 0 ].classList.add( bodyFullscreenClassName );
		} else {
			document.body.classList.remove( bodyFullscreenClassName );
			document.getElementsByTagName( 'html' )[ 0 ].classList.remove( bodyFullscreenClassName );
			if ( lastScrollPosition ) {
				window.scrollTo( ...lastScrollPosition );
			}
		}
	}, [ fullscreen ] );

	return (
		<>
			<ShadowRoot { ...shadowDOM }>
				{
					// eslint-disable-next-line
				 }
				<div
					ref={ rootElementRef }
					className={ classNames( className, {
						[ fullscreenClassName ]: isFullscreen,
					} ) }
					onKeyDown={ onKeyDown }
					aria-hidden="true"
				>
					{ ! isFullPageModalOpened && children }
				</div>
			</ShadowRoot>
			<Modal
				className={ classNames( className, {
					[ fullscreenClassName ]: isFullPageModalOpened,
				} ) }
				isOpened={ isFullPageModalOpened }
				onRequestClose={ onExitFullscreen }
				shadowDOM={ shadowDOM }
				onKeyDown={ isFullPageModalOpened && onKeyDown }
			>
				{ isFullPageModalOpened && children }
			</Modal>
		</>
	);
}