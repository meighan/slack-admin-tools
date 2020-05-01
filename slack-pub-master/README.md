# slack-pub

Publish a read-only version of a Slack team on the internet!

A work-in-progress.

Built with Express and LokiJS.

## Demo

<img width="1028" alt="Friends of HasGeek slack archive" src="https://user-images.githubusercontent.com/3104454/32869687-59cae0b0-ca46-11e7-87af-bf8c1fe5b10d.png">

View a demo of the [Friends of HasGeek slack archive](https://slack-pub-demo.herokuapp.com/general).

### Usage

* Export your Slack team's data from [https://my.slack.com/services/export](https://my.slack.com/services/export)
* Unzip the ZIP file into a folder called `archive` in this project's folder
* Install dependencies with `npm install` or `yarn install`
* Edit `config.js` with your team's data
* Run the app with `npm start`
* View archive at `http://localhost:3000/`


### Credits

CSS is based on @machonky's [Slack clone codepen](https://codepen.io/machonky/pen/epGNWO)
