/**
 * External dependencies
 */
import { EventEmitter } from 'events';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	render,
	createElement,
	useRef,
	useState,
	useEffect,
	useLayoutEffect,
	useCallback,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Slide from './slide';
import ProgressBar from './progress-bar';
import { Background, Controls, Header, Overlay } from './components';
import useResizeObserver from './use-resize-observer';

export const Player = ( { slides, playerEvents, disabled, ...settings } ) => {
	const [ currentSlideIndex, updateSlideIndex ] = useState( 0 );
	const [ playing, setPlaying ] = useState( false );
	const [ fullscreen, setFullscreen ] = useState( false );
	const [ ended, setEnded ] = useState( false );
	const [ muted, setMuted ] = useState( settings.startMuted );
	const [ loading, setLoading ] = useState( true );
	const [ currentSlideProgress, setCurrentSlideProgress ] = useState( 0 );

	const slidesWrapperRef = useRef();
	const [ slideWidth, setSlideWidth ] = useState( 279 );
	const [ resizeListener, { height } ] = useResizeObserver();

	const showSlide = ( slideIndex, play = true ) => {
		setCurrentSlideProgress( 0 );
		updateSlideIndex( slideIndex );

		if ( play ) {
			setPlaying( play );
		}
	};

	const tryPreviousSlide = useCallback( () => {
		if ( currentSlideIndex > 0 ) {
			showSlide( currentSlideIndex - 1 );
		}
	}, [ currentSlideIndex ] );

	const tryNextSlide = useCallback( () => {
		if ( currentSlideIndex < slides.length - 1 ) {
			showSlide( currentSlideIndex + 1 );
		} else {
			setPlaying( false );
			setEnded( true );
			setCurrentSlideProgress( 100 );
			playerEvents.emit( 'end' );
			if ( settings.exitFullscreenOnEnd ) {
				setFullscreen( false );
			}
		}
	}, [ currentSlideIndex ] );

	const onExitFullscreen = useCallback( () => {
		setFullscreen( false );
		if ( settings.playInFullscreen ) {
			setPlaying( false );
		}
	}, [ fullscreen ] );

	// pause player when disabled
	useEffect( () => {
		if ( disabled && playing ) {
			setPlaying( false );
		}
	}, [ disabled, playing ] );

	// reset player on slide change
	useEffect( () => {
		setLoading( true );
		setPlaying( false );
		showSlide( 0, false );
	}, [ slides ] );

	// track play/pause state and check ending
	useLayoutEffect( () => {
		playerEvents.emit( playing ? 'play' : 'pause' );
		if ( playing ) {
			setEnded( false );
		}
	}, [ playing ] );

	useLayoutEffect( () => {
		playerEvents.emit( muted ? 'mute' : 'unmute' );
	}, [ muted ] );

	useLayoutEffect( () => {
		playerEvents.emit( fullscreen ? 'go-fullscreen' : 'exit-fullscreen' );
	}, [ fullscreen ] );

	useEffect( () => {
		if ( settings.loadInFullscreen ) {
			setFullscreen( true );
		}
	}, [] );

	useEffect( () => {
		playerEvents.emit( 'seek', currentSlideIndex );
	}, [ currentSlideIndex ] );

	useEffect( () => {
		if ( ! loading ) {
			playerEvents.emit( 'ready' );
		}
	}, [ loading ] );

	useEffect( () => {
		playerEvents.emit( 'slide-progress', currentSlideProgress, currentSlideIndex );
	}, [ currentSlideProgress ] );

	useEffect( () => {
		const width = Math.round( settings.defaultAspectRatio * height );
		setSlideWidth( width );
	}, [ height ] );

	return (
		<>
			<div
				className={ classNames( 'wp-story-container', {
					'wp-story-with-controls': ! disabled && ! fullscreen && ! settings.playInFullscreen,
					'wp-story-fullscreen': fullscreen,
					'wp-story-ended': ended,
					'wp-story-disabled': disabled,
				} ) }
				style={ { width: `${ slideWidth }px` } }
			>
				{ resizeListener }
				<Header
					{ ...settings.metadata }
					fullscreen={ fullscreen }
					onExitFullscreen={ onExitFullscreen }
				/>
				<ul className="wp-story-wrapper" ref={ slidesWrapperRef }>
					{ slides.map( ( media, index ) => (
						<Slide
							key={ index }
							media={ media }
							index={ index }
							currentSlideIndex={ currentSlideIndex }
							playing={ currentSlideIndex === index && playing }
							muted={ muted }
							ended={ ended }
							onProgress={ setCurrentSlideProgress }
							onLoaded={ () => index === 0 && setLoading( false ) }
							onEnd={ tryNextSlide }
							settings={ settings }
						/>
					) ) }
				</ul>
				<Overlay
					playing={ playing }
					ended={ ended }
					hasPrevious={ currentSlideIndex > 0 }
					hasNext={ currentSlideIndex < slides.length - 1 }
					disabled={ settings.disabled }
					tapToPlayPause={ ! fullscreen && settings.tapToPlayPause }
					onClick={ () => {
						if ( ! fullscreen && ! playing && settings.playInFullscreen ) {
							setFullscreen( true );
						}
						if ( ended && ! playing ) {
							showSlide( 0 );
						} else {
							setPlaying( ! playing );
						}
					} }
					onPreviousSlide={ tryPreviousSlide }
					onNextSlide={ tryNextSlide }
				/>
				<ProgressBar
					slides={ slides }
					fullscreen={ fullscreen }
					currentSlideIndex={ currentSlideIndex }
					currentSlideProgress={ currentSlideProgress }
					onSlideSeek={ showSlide }
				/>
				<Controls
					playing={ playing }
					muted={ muted }
					setPlaying={ setPlaying }
					setMuted={ setMuted }
				/>
			</div>
			{ fullscreen && (
				<Background currentMedia={ settings.blurredBackground && slides[ currentSlideIndex ] } />
			) }
		</>
	);
};

export const renderPlayer = ( container, settings ) => {
	const playerEvents = new EventEmitter();

	render( <Player playerEvents={ playerEvents } { ...settings } />, container );

	return playerEvents;
};