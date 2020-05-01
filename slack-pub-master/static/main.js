window.myVue = new Vue({
  el: '#vue-app',
  data: {
    messages: [],
    loadedFirstMessages: false,
    channelId: window.channelId
  },
  mounted: function () {
    this.$http.get('api/' + this.channelId + '/messages', {
      params: {
        page: 0,
        offset: 50
      }
    }).then(response => {
      return response.json()
    })
    .then(response => {
      var messageData = response
      if (messageData.code === 200) {
        this.messages = messageData.data.concat(this.messages)
        this.$nextTick(function () {
          this.$el.parentElement.scrollTop = this.$el.parentElement.scrollHeight
          this.loadedFirstMessages = true
        })
      }
    },
    response => {
      console.log('Error', response)
    })
  },
  methods: {
    infiniteHandler ($state) {
      this.$http.get('api/' + this.channelId + '/messages', {
        params: {
          page: this.messages.length / 50,
          offset: 50
        }
      }).then(response => {
        return response.json()
      })
      .then(response => {
        var messageData = response
        if (messageData.code === 200) {
          var lastMessageId = this.messages[0].ts
          this.messages = messageData.data.concat(this.messages)
          this.$refs.infiniteLoading.scrollParent.scrollTop = this.$refs.infiniteLoading.scrollParent.offsetHeight
          $state.loaded()
          this.$nextTick(function () {
            var lastMessage = document.getElementById(lastMessageId)
            this.$el.parentElement.scrollTop = lastMessage.offsetTop - 60
          })
          if (this.messages.length / 20 === 10) {
            $state.complete()
          }
        } else {
          $state.complete()
        }
      },
      response => {
        console.log('Error', response)
      })
    }
  }
})
