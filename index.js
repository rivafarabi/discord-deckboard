/**
 * @autor Aislan Dener <https://github.com/aislandener>
 */

const RPC = require('discord-rpc');
const ncp = require('copy-paste');
const { dialog } = require('electron');
const { Extension, log, INPUT_METHOD, PLATFORMS } = require('deckboard-kit');

class DiscordExtension extends Extension {
	constructor(props) {
		super();
		this.setValue = props.setValue;
		this._redirectUri = 'https://discord.com';
		this._scopes = [
			'identify',
			'rpc',
			'rpc.notifications.read',
			'rpc.voice.read',
			'rpc.voice.write',
			'rpc.activities.write',
		];
		this._client = new RPC.Client({ transport: 'ipc' });

		this.name = 'Discord Deckboard';
		this.platforms = [PLATFORMS.WINDOWS, PLATFORMS.MAC, PLATFORMS.LINUX];
		this.configs = {
			discordClientId:{
				type: "text",
				name: "Client ID",
				descriptions: "Client ID in OAuth2 App",
				value: "",
			},
			discordClientSecret:{
				type: "text",
				name: "Client Secret (not distribute)",
				descriptions: "Client Secret in OAuth2 App",
				value: "",
			},
			discordAccessToken:{
				type: "text",
				name: "Access Token (not distribute)",
				descriptions: "Access Token in OAuth2 App",
				value: "",
			},
		};
		this.inputs = [
			{
				label: 'Microphone',
				value: "microphone",
				icon: 'microphone',
				color: '#5865F2',
				input:[
					{
						label: "Action",
						ref: "action",
						type: INPUT_METHOD.INPUT_SELECT,
						items:[
							{
								value: "toggle_microphone",
								label: "Toggle Microphone",
							},{
								value: "enable_microphone",
								label: "Enable Microphone",
							},{
								value: "disable_microphone",
								label: "Disable Microphone",
							},
						]
					},
				]
			},
			{
				label: 'Deaf',
				value: "headphone",
				icon: 'headphones',
				color: '#5865F2',
				input:[
					{
						label: "Action",
						ref: "action",
						type: INPUT_METHOD.INPUT_SELECT,
						items:[
							{
								value: "toggle_headphone",
								label: "Toggle Deaf",
							},{
								value: "enable_headphone",
								label: "Disable Deaf",
							},{
								value: "disable_headphone",
								label: "Enable Deaf",
							},
						]
					},
				]
			},
			{
				label: 'Disconnect Voice Channel',
				value: "disconnect-voice",
				icon: 'phone-slash',
				color: '#5865F2',
			},
			// {
			// 	label: 'Connect Voice Channel',
			// 	value: 'connect-voice',
			// 	icon: 'phone',
			// 	color: '#5865F2',
			// 	input: [
			// 		{
			// 			label: "Server",
			// 			ref: "guildId",
			// 			type: 'input:autocomplete',
			// 		}
			// 	],
			// },
			{
				label: 'Execute Action',
				value: 'streamerbot-action2',
				icon: 'robot',
				color: '#5b00a0',
				input: [
					{
						label: 'Action',
						ref: 'actionId',
						type: 'input:autocomplete'
					},
					{
						label: 'Arguments',
						ref: 'args',
						type: 'input:text'
					}
				]
			},
		];
		this.initExtension();
	}

	// Executes when the extensions loaded every time the app start.
	initExtension() {
		try {
			if(this.configs.discordClientId.value === '' || this.configs.discordClientId.value === null)
				return;

			log.warn('INIT Discord...')

			this._client.login({
				clientId: this.configs.discordClientId.value,
				clientSecret: this.configs.discordClientSecret.value,
				scopes: this._scopes,
				redirectUri: this._redirectUri,
				accessToken: this.configs.discordAccessToken.value
			}).then(async _ => {
				if(this.configs.discordAccessToken.value === '' || this.configs.discordAccessToken.value === null ){
					return dialog.showMessageBox(null,{
						type: 'info',
						buttons: ['Copy','OK'],
						defaultId: 0,
						title: "Token Discord",
						message: `Copy access token and paste in config in Config(Cog) > Extensions > Config > 'Access Token (not distribute)'`
					},_ => ncp.copy(this._client.accessToken));
				}
				log.error(await this.getGuilds())
			});


		}catch (e){
			log.error(e);
		}
		log.error(this.getGuilds())
	}

	get selections() {
		return [{
			header: this.name
		}, ...this.inputs];
	}

	getAutocompleteOptions(ref) {
		log.error(ref);
		switch(ref) {
			case 'actionId':
				return this.getGuilds();
			default:
				return []
		}

	}

	getGuilds() {
		return this._client.getGuilds().then(({guilds}) => guilds.map(
			x => ({
				value: x.id,
				label: x.name,
			})));
	}

	async _microphoneControl(args){
		switch (args.action){
			case 'toggle_microphone':
				const settings = await this._client.getVoiceSettings();
				return await this._client.setVoiceSettings({mute: !settings.mute});
			case 'enable_microphone':
				return await this._client.setVoiceSettings({
					mute: false
				});
			case 'disable_microphone':
				return await this._client.setVoiceSettings({
					mute: true
				});
		}
	}

	async _headphoneControl(args){
		switch (args.action){
			case 'toggle_headphone':
				const settings = await this._client.getVoiceSettings();
				return await this._client.setVoiceSettings({deaf: !settings.deaf});
			case 'enable_headphone':
				return await this._client.setVoiceSettings({
					deaf: false
				});
			case 'disable_headphone':
				return await this._client.setVoiceSettings({
					deaf: true
				});
		}
	}

	async _connectVoiceControl(args){
		return await this._client.selectVoiceChannel(args.channel_id,{force: true});
	}

	execute(action, args) {
		switch(action){
			case 'microphone':
				return this._microphoneControl(args);
			case 'headphone':
				return this._headphoneControl(args);
			case 'disconnect-voice':
				return this._connectVoiceControl(args);
		}
	};
}

module.exports = (sendData) => new DiscordExtension(sendData);
