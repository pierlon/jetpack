/**
 * External dependencies
 */
import waitMediaReady from './lib/wait-media-ready';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useEffect, useState, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Media, CalypsoSpinner } from './components';

export const Slide = ( {
	playerId,
	media,
	index,
	playing,
	uploading,
	settings,
	targetAspectRatio,
} ) => {
	const { currentSlideIndex } = useSelect(
		select => ( {
			currentSlideIndex: select( 'jetpack/story/player' ).getCurrentSlideIndex( playerId ),
		} ),
		[]
	);

	const { slideReady } = useDispatch( 'jetpack/story/player' );

	const visible = index === currentSlideIndex;
	const mediaRef = useRef( null );
	const [ preload, setPreload ] = useState( false );
	const [ loading, setLoading ] = useState( true );
	const isVideo = () =>
		mediaRef.current && mediaRef.current.src && mediaRef.current.tagName.toLowerCase() === 'video';

	useEffect( () => {
		if ( visible && ! loading ) {
			const video = isVideo() ? mediaRef.current : null;
			slideReady( playerId, mediaRef.current, video ? video.duration : settings.imageTime );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ visible, loading ] );

	useEffect( () => {
		if ( index <= currentSlideIndex + ( playing ? 1 : 0 ) ) {
			setPreload( true );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ playing, currentSlideIndex ] );

	// Sync media loading
	useLayoutEffect( () => {
		if ( ! mediaRef.current ) {
			return;
		}
		waitMediaReady( mediaRef.current, true ).then( () => {
			setLoading( false );
		} );
	}, [ preload, uploading ] );

	/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
	return (
		<>
			{ visible && ( loading || uploading ) && (
				<div className={ classNames( 'wp-story-slide', 'is-loading', { transparent: uploading } ) }>
					<CalypsoSpinner />
				</div>
			) }
			<div
				role="figure"
				className="wp-story-slide"
				style={ { display: visible && ! loading ? 'block' : 'none' } }
				tabIndex={ 0 }
			>
				{ preload && (
					<Media
						{ ...media }
						targetAspectRatio={ targetAspectRatio }
						cropUpTo={ settings.cropUpTo }
						index={ index }
						mediaRef={ mediaRef }
					/>
				) }
			</div>
		</>
	);
	/* eslint-enable jsx-a11y/no-noninteractive-tabindex */
};

export default Slide;
