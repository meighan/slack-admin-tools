var system = require('system')
var fs = require('fs')
var casper = require('casper').create()

var config = {
  startExportIfPossible: false,
  revokeDownloadTokens: false,
  revokePastExports: false
}

function reloadUntil (selector, delay, testFunc) {
  casper.then(function () {
    this.reload(function () {
      if (!testFunc()) {
        this.wait(delay, function () {
          reloadUntil(selector, delay, testFunc)
        })
      }
    })
  })
}

var cssSelector = {
  loginPage: {
    teamName: '#signin_header .break_word',
    signIn: {
      form: '#signin_form'
    }
  },
  exportPage: {
    export: {
      startExportBtn: 'input[name=start_export] ~ span button'
    },
    exportHistory: {
      latestExportDownloadBtn: '#export_history > tbody > tr:nth-child(1) > td:nth-child(3) > a',
      forms: '#export_history form',
      removeExportBtns: 'input[name=remove_export] ~ i.remove_export'
    },
    downloadTokens: {
      forms: '#export_tokens form',
      revokeAllBtn: 'input[name=revoke_all] ~ button'
    }
  }
}

// Resouce hook to save the exported archive to a location on the filesystem
casper.on('resource.received', function (resource) {
  if ((resource.url.indexOf('services/export/download/') !== -1)) {
    var filename = 'archive.zip'
    try {
      this.echo('Attempting to download file ' + filename + ' from ' + resource.url)
      casper.download(resource.url, fs.workingDirectory + '/' + filename)
    } catch (e) {
      this.echo(e)
    }
  }
})

var domain = 'https://' + system.env.SP_DOMAIN

// Start by trying to visit the export page, so it redirects here automatically
// after logging in
casper.start(domain + '/services/export')

// Login to the Slack team with the username and password
casper.then(function () {
  if (this.exists(cssSelector.loginPage.signIn.form)) {
    this.echo(this.fetchText(cssSelector.loginPage.teamName)) // Get team name
    this.fill(cssSelector.loginPage.signIn.form, {
      'email': system.env.SP_EMAIL,
      'password': system.env.SP_PASS
    }, true)
  }
})

// When at the export page, do some things!

// If export button is visible, click it and wait until the download link is available
if (config.startExportIfPossible) {
  casper.waitForUrl(domain + '/services/export', function () {
    if (this.exists(cssSelector.exportPage.export.startExportBtn)) {
      this.click(cssSelector.exportPage.export.startExportBtn)
      reloadUntil(cssSelector.exportPage.exportHistory.latestExportDownloadBtn, 2500, function () {
        return casper.exists(cssSelector.exportPage.exportHistory.latestExportDownloadBtn) // return when element exists
      })
    }
  })
}
// Look for the latest downloadable export and click the button
casper.waitForUrl(domain + '/services/export', function () {
  this.echo(this.getTitle())
  this.echo('Inside login page')
  this.echo(this.getHTML(cssSelector.exportPage.exportHistory.latestExportDownloadBtn)) // Get download link
  this.click(cssSelector.exportPage.exportHistory.latestExportDownloadBtn)
  this.wait(5000)
})

casper.thenOpen(domain + '/services/export')

// Revoke earlier exports to keep things clutter free
if (config.revokePastExports) {
  casper.waitForUrl(domain + '/services/export', function () {
    reloadUntil(cssSelector.exportPage.exportHistory.removeExportBtns, 2500, function () {
      casper.fill(cssSelector.exportPage.exportHistory.forms, {}, true) // Submit's the first form
      return casper.exists(cssSelector.exportPage.exportHistory.removeExportBtns) // return when element exists
    })
  })
}

// Revoke earlier download tokens to keep things secure
if (config.revokeDownloadTokens) {
  casper.waitForUrl(domain + '/services/export', function () {
    if (this.exists(cssSelector.exportPage.downloadTokens.revokeAllBtn)) {
      this.click(cssSelector.exportPage.downloadTokens.revokeAllBtn)
    }
  })
}
// page_contents

casper.run()
