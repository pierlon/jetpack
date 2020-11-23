/**
 * Internal dependencies
 */
import { waitForSelector } from '../page-helper';
import LoginPage from '../pages/wpcom/login';
import ConnectionsPage from '../pages/wpcom/connections';
import logger from '../logger';

export default class MailchimpBlock {
	constructor( blockId, page ) {
		this.blockTitle = MailchimpBlock.title();
		this.page = page;
		this.blockSelector = '#block-' + blockId;
	}

	static name() {
		return 'mailchimp';
	}

	static title() {
		return 'Mailchimp';
	}

	/**
	 * Sets-up a mailchimp connection. Method expects to see a "Set up Mailchimp from" button in block editor.
	 * - Starts by logging in to WPCOM account in page opened in new tab
	 * - Connects to Mailchimp once Connection page is loaded
	 * - Closes WPCOM tab
	 *
	 * @param {boolean} isLoggedIn Whether we need to login before connecting
	 *
	 */
	async connect( isLoggedIn = true ) {
		const setupFormSelector = this.getSelector( "a[href*='calypso-marketing-connections']" );
		const formSelector = await waitForSelector( this.page, setupFormSelector );
		const hrefProperty = await formSelector.getProperty( 'href' );
		const connectionsUrl = await hrefProperty.jsonValue();
		const loginTab = await clickAndWaitForNewPage( this.page, setupFormSelector );

		if ( ! isLoggedIn ) {
			await ( await LoginPage.init( loginTab ) ).login( 'defaultUser' );
		}

		// Hacky way to force-sync Publicize activation. The first attempt is always get redirected to stats page.
		// TODO:
		// explore a better way to sync the site. Maybe enable all the required modules as part of connection flow
		// Or implement a way to trigger a sync manually.
		let loaded = false;
		let count = 0;
		while ( ! loaded ) {
			try {
				count++;
				await ConnectionsPage.init( loginTab );
				loaded = true;
			} catch ( e ) {
				logger.info(
					'ConnectionsPage is not available yet. Attempt: ' + count,
					' URL: ' + connectionsUrl
				);
				await loginTab.goto( connectionsUrl, { timeout: 120000 } );
				if ( count > 9 ) {
					throw new Error( 'ConnectionsPage is not available is not available after 10th attempt' );
				}
			}
		}

		await loginTab.reload( { waitUntil: 'networkidle' } );

		await ( await ConnectionsPage.init( loginTab ) ).selectMailchimpList();

		await this.page.bringToFront();
		const reCheckSelector = this.getSelector( 'button.is-link' );
		await page.click( reCheckSelector );
	}

	getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {page} page Playwright page instance
	 */
	static async isRendered( page ) {
		const containerSelector = '.wp-block-jetpack-mailchimp';
		const emailSelector = containerSelector + " input[type='email']";
		const submitSelector = containerSelector + " button[type='submit']";
		const consentSelector = containerSelector + ' #wp-block-jetpack-mailchimp_consent-text';

		await waitForSelector( page, containerSelector );
		await waitForSelector( page, emailSelector );
		await waitForSelector( page, submitSelector );
		await waitForSelector( page, consentSelector );
	}
}
