import React, { Component } from 'react';
import classnames from 'classnames';
import { isBrowser, isMobile } from 'react-device-detect';
import { connect } from 'react-redux';
import { loadReCaptcha } from 'react-recaptcha-v3';
import { bindActionCreators } from 'redux';
import moment from 'moment';

import { AppFooter } from '../../components';
import { FLEX_CENTER_CLASSES, CAPTCHA_SITEKEY, EXCHANGE_EXPIRY_DAYS, EXCHANGE_EXPIRY_SECONDS } from '../../config/constants';
import STRINGS from '../../config/localizedStrings';
import { getClasesForLanguage } from '../../utils/string';
import { getThemeClass } from '../../utils/theme';
import { getExchangeInfo } from '../../actions/appActions';

const updateThemeToBody = (theme = 'white') => {
	// const themeName = theme === 'dark' ? 'dark-auth-body' : 'light-auth-body';
	if (document.body) {
		// document.body.className = themeName;
	}
};
const checkPath = (path) => {
	var sheet = document.createElement('style')
	if ((path === '/login') || (path === '/signup')
		|| (path === '/reset-password') || path.includes('/withdraw')) {
		sheet.innerHTML = ".grecaptcha-badge { display: unset !important;}";
		sheet.id = 'addCap'
		if (document.getElementById('rmvCap') !== null) {
			document.body.removeChild(document.getElementById('rmvCap'));
		}
	} else {
		sheet.innerHTML = ".grecaptcha-badge { display: none !important;}";
		sheet.id = 'rmvCap'
		if (document.getElementById('addCap') !== null) {
			document.body.removeChild(document.getElementById('addCap'));
		}
	}
	document.body.appendChild(sheet);
}

class AuthContainer extends Component {
	constructor(props) {
		super(props)
		this.state = {
			isExpired: false,
			isTrial: false
		}
	}

	componentDidMount() {
		this.props.getExchangeInfo();
	}

	render() {
		const { activeLanguage, activeTheme, children, info, constants = { captcha: {} }, ...rest } = this.props;
		const languageClasses = getClasesForLanguage(activeLanguage);
		const childWithLanguageClasses = React.Children.map(children, (child) =>
			React.cloneElement(child, { activeLanguage, languageClasses })
		);
		let siteKey = CAPTCHA_SITEKEY;
		if (constants.captcha && constants.captcha.site_key) {
			siteKey = constants.captcha.site_key;
		}
		loadReCaptcha(siteKey);
		updateThemeToBody(activeTheme);
		let isWarning = false;
		if (rest.location && rest.location.pathname) {
			checkPath(rest.location.pathname);
			isWarning = ((rest.location.pathname === '/login' || rest.location.pathname === '/signup')
				&& (!Object.keys(info).length || info.is_trial || !info.active))
				? true : false;
		};
		const isExpired =
			!Object.keys(info).length || !info.active ||
			(info.active && info.is_trial && moment().diff(info.created_at, 'seconds') > EXCHANGE_EXPIRY_SECONDS)
				? true
				: false;
		const expiryDays = EXCHANGE_EXPIRY_DAYS - moment().diff(info.created_at, 'days');
		return (
			<div className="w-100 h-100">
				{isWarning
					? <div className={classnames(
						'exchange-warning',
						'p-1',
						...FLEX_CENTER_CLASSES,
						{
							'exchange-trial': isWarning,
							'exchange-expired': isExpired,
						}
					)}>
						{isExpired
							? STRINGS.EXPIRY_EXCHANGE_MSG
							: STRINGS.formatString(
								STRINGS.TRIAL_EXCHANGE_MSG,
								STRINGS.APP_TITLE,
								expiryDays
							)
						}
					</div>
					: null
				}
				<div
					className={classnames(
						'auth-wrapper',
						'w-100',
						'h-100',
						getThemeClass(activeTheme),
						{
							'layout-mobile': isMobile,
							'layout-desktop': isBrowser
						},
						...FLEX_CENTER_CLASSES
					)}
				>
					<div className={classnames('auth-container', 'f-1', languageClasses)}>
						{childWithLanguageClasses}
					</div>
				</div>
				{!isMobile
					? (
						<div className={classnames('footer-wrapper', getThemeClass(activeTheme))}>
							<AppFooter theme={activeTheme} constants={constants} />
						</div>
					)
					: null
				}
			</div>
		);
	}
}

const mapStateToProps = (store) => ({
	activeLanguage: store.app.language,
	activeTheme: store.app.theme,
	info: store.app.info,
	constants: store.app.constants
});

const mapDispatchToProps = dispatch => ({
	getExchangeInfo: bindActionCreators(getExchangeInfo, dispatch)
});

export default connect(mapStateToProps, mapDispatchToProps)(AuthContainer);
