const { InstallProvider } = require('@slack/oauth');
const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');
const express = require('express');
// Using Keyv as an interface to our database
// see https://github.com/lukechilds/keyv for more info
const Keyv = require('keyv');

const app = express();
const port = 3000;


// Initialize slack events adapter
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
// Set path to receive events
app.use('/slack/events', slackEvents.requestListener());

// can use different keyv db adapters here
// ex: const keyv = new Keyv('redis://user:pass@localhost:6379');
// using the basic in-memory one below
const keyv = new Keyv();

keyv.on('error', err => console.log('Connection Error', err));

const installer = new InstallProvider({
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  authVersion: 'v2',
  stateSecret: 'my-state-secret',
  installationStore: {
    storeInstallation: (installation) => {
      return keyv.set(installation.team.id, installation);
    },
    fetchInstallation: (InstallQuery) => {
      return keyv.get(InstallQuery.teamId);
    },
  },
});

app.get('/', (req, res) => res.send('go to /slack/install'));

app.get('/slack/install', async (req, res, next) => {
  try {
    // feel free to modify the scopes
    const url = await installer.generateInstallUrl({
      scopes: ['channels:read', 'groups:read', 'channels:manage', 'chat:write', 'incoming-webhook'],
      metadata: 'some_metadata',
    })
    
    res.send(`<a href=${url}><img alt=""Add to Slack"" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>`);
  } catch(error) {
    console.log(error)
  }
});

// example 1
// use default success and failure handlers
app.get('/slack/oauth_redirect', async (req, res) => {
  await installer.handleCallback(req, res);
});

// example 2
// using custom success and failure handlers
// const callbackOptions = {
//   success: (installation, metadata, req, res) => {
//     res.send('successful!');
//   },
//   failure: (error, installOptions , req, res) => {
//     res.send('failure');
//   },
// }
//
// app.get('/slack/oauth_redirect', async (req, res) => {
//   await installer.handleCallback(req, res, callbackOptions);
// });

// When a user navigates to the app home, grab the token from our database and publish a view
slackEvents.on('app_home_opened', async (event) => {
  try {
    if (event.tab === 'home') {
      const DBInstallData = await installer.authorize({teamId:event.view.team_id});
      const web = new WebClient(DBInstallData.botToken);
      await web.views.publish({
        user_id: event.user,
        view: { 
          "type":"home",
          "blocks":[
            {
              "type": "section",
              "block_id": "section678",
              "text": {
                "type": "mrkdwn",
                "text": "Welcome to the App Home!"
              },
            }
          ]
        },
      });
    }
  }
  catch (error) {
    console.error(error);
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}! Go to http://localhost:3000/slack/install to initiate oauth flow`))
