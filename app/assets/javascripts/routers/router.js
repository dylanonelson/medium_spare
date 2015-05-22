MediumClone.Routers.Router = Backbone.Router.extend({
  
  initialize : function (options) {
    this.$root = options.$root;
    this.$sidebar = options.$sidebar;
    this.$status = options.$status

    var sidebar = new MediumClone.Views.UserSidebar();
    this.$sidebar.append(sidebar.render().$el);

    var loggedInStatus = new MediumClone.Views.LoggedInStatus();
    this.$status.html(loggedInStatus.render().$el);

    MediumClone.tags.fetch();
    MediumClone.currentUser.fetch();
    this.listenTo(MediumClone.currentUser, 'signIn', this._renderSignedIn);
    this.listenTo(MediumClone.currentUser, 'signOut', this._renderSignedOut);
  },

  routes : {
    '' : 'welcome',
    'feed' : 'feed',
    'profile' : 'profile',
    'stories/new' : 'newStory',
    'stories/:id/edit' : 'editStory',
    'stories/:id' : 'showStory',
    'users/new' : 'newUser',
    'users/:id' : 'showUser',
    'tags/:id' : 'showTag',
    'session/new' : 'newSession', 
  },

  welcome : function () {
    this.$root.html('<p class="welcome-text">Welcome to Medium</p>');
  },

  feed : function () {
    if (!this._requireSignedIn(function () {
      MediumClone.router.feed();
      Backbone.history.navigate('feed');
    })) { return; }

    MediumClone.feed.fetch();

    var feedView = new MediumClone.Views.StoriesIndex({
      collection : MediumClone.feed,
    })

    this._swapView(feedView);
  },

  profile : function () {
    if (!this._requireSignedIn(function () {
      MediumClone.router.profile();
      Backbone.history.navigate('profile');
    })) { return; }

    MediumClone.currentUser.stories().fetch();

    var profileView = new MediumClone.Views.CurrentUserProfileShow({
      model : MediumClone.currentUser,
      collection : MediumClone.currentUser.stories(),
    });

    this._swapView(profileView);
  },

  newStory : function () {
    if (!this._requireSignedIn(function () {
      MediumClone.router.newStory();
      Backbone.history.navigate('stories/new');
    })) { return; }

    var newStoryView = new MediumClone.Views.StoryForm({
      model : new MediumClone.Models.Story(),
    });

    this._swapView(newStoryView);
  },

  editStory : function (id) {
    if (!this._requireSignedIn(function () {
      MediumClone.router.editStory(id);
      Backbone.history.navigate('stories/' + id + '/edit');
    })) { return; }

    var forEditing = new MediumClone.Models.Story({
      id : id,
    });

    forEditing.fetch();

    var editStoryView = new MediumClone.Views.StoryForm({
      model : forEditing,
    });

    this._swapView(editStoryView);
  },

  showStory : function (id) {
    var showStoryView = new MediumClone.Views.StoryShow({
      model : MediumClone.stories.getOrFetch(id),
    });

    this._swapView(showStoryView);
  },

  showUser : function (id) {
    if (id == MediumClone.currentUser.id) {
      this.profile();
      return
    }

    var user = new MediumClone.Models.User({
      id : id,
    });

    user.fetch();
    user.stories().fetch();
    
    var showUserView = new MediumClone.Views.ProfileShow({
      model : user,
      collection : user.stories(),
    });

    this._swapView(showUserView);
  },

  newUser : function () {
    if (!this._requireSignedOut(function () {
      MediumClone.router.newUser();
      Backbone.history.navigate('profile');
    })) { return; }
    var newUserView = new MediumClone.Views.UserForm();
    this._swapView(newUserView);
  },

  showTag : function (id) {
    var tag = MediumClone.tags.getOrFetch(id);
    tag.stories().fetch();

    var showTagView = new MediumClone.Views.TagShow({
      model : tag,
    });

    this._swapView(showTagView);
  },

  newSession : function (callback) {
    if (!this._requireSignedOut(function () {
      MediumClone.router.newSession();
      Backbone.history.navigate('session/new');
    })) { return; }
    var sessionForm = new MediumClone.Views.SessionForm({
      callback : callback
    });
    this._swapView(sessionForm);
  },

  _swapView : function (view) {
    this._currentView && this._currentView.remove();
    this._currentView = view;
    this.$root.html(view.render().$el);
  },

  _requireSignedIn : function (callback) {
    if (!MediumClone.currentUser.isSignedIn()) {
      callback = callback;
      this.newSession(callback);
      return false;
    }

    return true;
  },

  _requireSignedOut : function (callback) {
    if (MediumClone.currentUser.isSignedIn()) {
      callback();
      return false;
    }

    return true;
  },

})