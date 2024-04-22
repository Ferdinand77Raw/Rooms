var Vtiger_Rooms_Js = {

    container: null,
    pushMessagesIntervalId: null,
    conn: null,
    /**
     * variable stores client side language strings
     */
    languageString: [],

    serial_id: null,

    load: function () {
        var thisInstance = this;
        //var scrollBarOption = {theme:"minimal"};
        var aDeferred = jQuery.Deferred();
        var params = {
            'type': 'GET',
            'url': 'index.php?module=Rooms&view=Home'
        };

        app.request.get(params).then(
            function (err, data) {
                if (err === null) {
                    $('#collaboration-home').html(data);
                    //thisInstance.registerEventNotification();
                    if ($('#collaboration-home #collaboration-container').length > 0) {
                        thisInstance.container = $('#collaboration-container');
                        vtUtils.applyFieldElementsView($('#collaboration-home'));
                        thisInstance.registerShowHistoryBoxEvent();
                        thisInstance.registerShowAllRoomBtnEvent();
                        thisInstance.registerAddRoomBtnEvent();
                        thisInstance.registerCancelRoomBtnEvent();
                        thisInstance.registerSaveRoomEvent();
                        thisInstance.registerOpenRoomDetailEvent();
                        thisInstance.registerArchiveRoomEvent();
                        thisInstance.registerRemoveArchiveRoomEvent();
                        thisInstance.registerLeaveRoomEvent();
                        thisInstance.registerPushNotification();
                        thisInstance.pushNotification();
                        //thisInstance.addRelatedTab();
                    }
                } else {
                    // to do somethings
                }
            }

        );

        return aDeferred.promise();
    },

    addRelatedTab: function () {
        var currentModuleName = app.getModuleName();
        var currentModuleView = app.getViewName();
        var currentRecordId = this.getRecordId();

        var aDeferred = jQuery.Deferred();
        var params = {};

        params['module'] = 'Rooms';
        params['action'] = 'RelatedTab';
        /**/
        app.request.post({ data: params }).then(
            function (err, data) {
                if (err === null) {
                    if (data.length > 0) {
                        var listRelatedModules = data;
                        if (listRelatedModules.indexOf(currentModuleName) > -1 && currentModuleView == 'Detail') {
                            var relatedTabContainer = jQuery('.detailview-content div.related-tabs ul.nav');
                            var conversationTab = '';
                            conversationTab += '<li class="tab-item" data-url="module=Rooms&relatedModule=' + currentModuleName + '&view=RelatedListCustom&record=' + currentRecordId + '&tab_label=' + app.vtranslate('Conversation') + '" data-label-key="' + app.vtranslate('Conversation') + '">';
                            conversationTab += '<a href="javascript:void(0);" class="textOverflowEllipsis" style="width:auto" title="' + app.vtranslate('Conversation') + '">';
                            //conversationTab +=          '<span class="tab-label"><strong>'+app.vtranslate('Conversation')+'</strong></span>';
                            conversationTab += '<i class="fa fa-comments-o" style="font-size: 23px;">&nbsp;</i>';
                            conversationTab += '</a>';
                            conversationTab += '</li>';
                            if (relatedTabContainer.find('li.related-tab-more-element').length > 0) {
                                relatedTabContainer.find('li.related-tab-more-element').before(conversationTab);
                            } else {
                                relatedTabContainer.append(conversationTab);
                            }
                        }
                    }
                } else {
                    // to do somethings
                }
            }
        );

        return aDeferred.promise();
    },

    registerScrollBar: function (container, options) {
        $.mCustomScrollbar.defaults.scrollButtons.enable = true; //enable scrolling buttons by default
        $.mCustomScrollbar.defaults.axis = "y"; //enable 2 axis scrollbars by default
        container.mCustomScrollbar(options);
    },

    registerPushMessages: function (record) {
        var thisInstance = this;
        var msg = thisInstance.pushMessages(record);
        return msg;
    },

    registerPushNotification: function () {
        var thisInstance = this;
        var regPush = thisInstance.pushNotification();
        return regPush;
    },

    pushMessages: function (record) {
        var thisInstance = this;
        if (jQuery('#messageForm' + record).length > 0) {
            var container = jQuery('#messageForm' + record).closest('#c-detail-container');
            var messageListElements = container.find('.message-list');
            var aDeferred = jQuery.Deferred();
            var params = {};
            params['module'] = 'RoomsMessages';
            params['action'] = 'PushMessages';
            params['room_id'] = record;

            app.request.post({ data: params }).then(
                function (err, data) {
                    if (err === null) {
                        if (data.length > 0) {
                            var messages = data;
                            var len = messages.length;
                            for (var i = 0; i < len; i++) {
                                var messageHtml = thisInstance.buildMessage(messages[i]);
                                thisInstance.pushNotification();
                                if (thisInstance.container.find('.c-details .message-box').length > 0 && thisInstance.container.find('.c-details .message-box #msg' + messages[i]._recordId).length == 0) {

                                    messageListElements.append(messageHtml);
                                    thisInstance.container.find('.c-details .message-box').animate({ scrollTop: $('.message-box').get(0).scrollHeight }, 0);
                                    thisInstance.showEmoticonsGraphic();
                                }
                            }
                        }
                    } else {
                        // to do somethings
                    }
                }
            );

            return aDeferred.promise();

        }
    },

    pushNotification: function () {
        var thisInstance = this;
        var aDeferred = jQuery.Deferred();
        var params = {};
        params['module'] = 'RoomsMessages';
        params['action'] = 'PushNotifications';

        app.request.post({ data: params }).then(
            function (err, data) {
                if (err === null) {
                    var notifications = data;
                    var rooms = notifications.rooms;
                    var len = rooms.length;
                    var total = notifications.total;
                    $('#c-notification-icon small').text(total).attr('title', total.toString() + ' ' + thisInstance.vtranslate('LBL_NEW_MESSAGE_TITLE'));
                    if (len > 0 && thisInstance.container) {
                        for (var i = 0; i < len; i++) {
                            if (rooms[i].unread > 0) {
                                if (thisInstance.container.find('.c-panel-sub-available .c-panel-room-title .unread-number-' + rooms[i].room_id).length > 0) {
                                    thisInstance.container.find('.c-panel-sub-available .c-panel-room-title .unread-number-' + rooms[i].room_id).html('<small>' + rooms[i].unread + '</small>');
                                } else {
                                    //add to list
                                    var room_type = rooms[i].type;
                                    var room_type_class = room_type.replace(' ', '-').toLowerCase();
                                    var roomListBox = thisInstance.container.find('.c-panel-sub-available .c-panel-' + room_type_class + ' ul');
                                    var newElement = '';
                                    newElement += '<li data-room-type="' + rooms[i].type + '" data-record="' + rooms[i].room_id + '" data-record-user="' + rooms[i].roomsusersid + '" class="c-panel-room-title">';
                                    newElement += '<span>' + rooms[i].name + '</span>';
                                    newElement += '<label class="room-unread-number unread-number-' + rooms[i].room_id + '"><small>' + rooms[i].unread + '</small></label>';
                                    if (room_type == 'Private Group') {
                                        newElement += '<i class="fa fa-power-off pull-right hide room-leave-btn"></i>';
                                    }
                                    newElement += '<i class="fa fa-eye-slash pull-right hide room-archive-btn"></i>';
                                    newElement += '</li>';
                                    roomListBox.prepend(newElement);
                                    thisInstance.registerOpenRoomDetailEvent();
                                    thisInstance.registerArchiveRoomEvent();
                                    thisInstance.registerLeaveRoomEvent();
                                    //console.log(room_type_class);
                                }
                            } else {
                                thisInstance.container.find('.c-panel-sub-available .c-panel-room-title .unread-number-' + rooms[i].room_id).html('');
                            }
                        }
                    }
                } else {
                    // to do
                }
            }
        );
        return aDeferred.promise();
    },

    registerShowAllRoomBtnEvent: function () {
        var thisInstance = this;
        this.container.find('.c-panel-sub-available .group-more').on('click', function (e) {
            e.preventDefault();
            thisInstance.container.find('.c-panel-sub-available').hide();
            thisInstance.container.find('.c-panel .c-me').hide();
            thisInstance.container.find('.c-panel-sub-all').show();
            var aDeferred = jQuery.Deferred();
            var type = $(this).data('type');
            var box = thisInstance.container.find('.c-panel-sub-all .c-panel-all-rooms');
            box.progressIndicator({});
            var params = {
                'type': 'GET',
                'url': 'index.php?module=Rooms&view=AllRooms&type=' + type
            };
            app.request.get(params).then(
                function (err, data) {
                    if (err === null) {
                        box.progressIndicator({ 'mode': 'hide' });
                        box.html(data);
                        thisInstance.registerCloseAllRoomBtnEvent();
                        thisInstance.registerFilterRoomsInAll();
                        thisInstance.registerOpenRoomDetailEvent();
                    } else {
                        // to do
                        box.progressIndicator({ 'mode': 'hide' });
                        aDeferred.reject(error);
                    }
                }
            );
            return aDeferred.promise();
        });
    },

    registerCloseAllRoomBtnEvent: function () {
        var thisInstance = this;
        this.container.find('.c-panel-sub-all .c-panel-all-rooms .close').on('click', function (e) {
            e.preventDefault();
            thisInstance.container.find('.c-panel-sub-all .c-panel-all-rooms').html('');
            thisInstance.container.find('.c-panel-sub-all').hide();
            thisInstance.container.find('.c-panel .c-me').show();
            thisInstance.container.find('.c-panel-sub-available').show();
        });
    },

    registerFilterRoomsInAll: function () {
        var thisInstance = this;
        this.container.find('.c-panel-sub-all .c-panel-all-rooms #search-room-in-all').on('keyup', function (e) {
            var searchValue = $(this).val();
            thisInstance.container.find('.c-panel-sub-all .c-panel-all-rooms ul li').hide();
            thisInstance.container.find('.c-panel-sub-all .c-panel-all-rooms ul li span').each(function () {
                var room_name = $(this).text();
                if (room_name.indexOf(searchValue) >= 0) {
                    $(this).closest('li').show();
                }
                //console.log(room_name.indexOf(searchValue));
            });
        });
    },

    registerAddRoomBtnEvent: function () {
        var thisInstance = this;
        this.container.find('.c-panel-sub-available .fa-plus-circle').on('click', function () {
            var type = $(this).data('type');
            thisInstance.container.find('.c-panel-sub-available').hide();
            thisInstance.container.find('.c-panel-sub-form .c-panel-sub-form-child').hide();
            thisInstance.container.find('.c-panel-sub-form').show();
            thisInstance.container.find('.c-panel-sub-form .c-panel-' + type + '-form').show();
            thisInstance.container.find('.c-panel-sub-form #' + type + '-name').focus();
        });
    },

    registerCancelRoomBtnEvent: function () {
        var thisInstance = this;
        this.container.find('.c-panel-sub-form .cancelLink').on('click', function () {
            thisInstance.container.find('.c-panel-sub-available').show();
            thisInstance.container.find('.c-panel-sub-form .c-panel-sub-form-child').hide();
            thisInstance.container.find('.c-panel-sub-form').hide();
            var form = $(this).closest('.c-panel-sub-form-child');
            $('input', form).each(function () {
                $(this).val('');
            });
            $('select', form).each(function () {
                $(this).val('').trigger("liszt:updated");
            });
        });
    },

    registerEventNotification: function () {
        var thisInstance = this;
        $('#c-notification-icon').on('click', function () {
            if (!thisInstance.container) {
                thisInstance.load();
            }
            $('#collaboration-home').toggle('slide', { direction: 'right' }, function () {
                if ($('#collaboration-home').css('display') == 'block') {
                    var last_room_active = app.storage.get('collaboration_last_room_active_' + app.getUserId(), null);
                    if (last_room_active) {
                        thisInstance.openRoomDetail(last_room_active);
                    }

                } else {
                    //clearInterval(thisInstance.pushMessagesIntervalId);
                }
            });
        });
    },

    showRoomDetailFromRelatedList: function (record) {
        app.storage.set('collaboration_last_room_active_' + app.getUserId(), record);
        $('#c-notification-icon').trigger('click');
    },

    registerSaveRoomEvent: function () {
        var thisInstance = this;
        this.container.find('.c-panel-sub-form .btn-success').on('click', function () {
            var type = $(this).data('type');
            if (type == 'channel') {
                thisInstance.saveChannelRoom();
            }
            if (type == 'direct-message') {
                thisInstance.saveDirectMessageRoom();
            }
            if (type == 'private-group') {
                thisInstance.savePrivateGroupRoom();
            }
        });
    },

    saveChannelRoom: function () {
        var thisInstance = this;
        var aDeferred = jQuery.Deferred();
        var urlParams = {};
        var channel_name = this.container.find('.c-panel-sub-form #channel-name').val();

        if (channel_name == '') {
            var params = {
                title: this.vtranslate('JS_CREATE_CHANNEL'),
                text: this.vtranslate('CHANNEL_NAME_EMPTY'),
                animation: 'show',
                type: 'error'
            };
            Vtiger_Helper_Js.showPnotify(params);
            return;
        }
        var formElement = thisInstance.container.find('.c-panel-channel-form');
        //formElement.progressIndicator({});
        formElement.append('<div class="collaboration-loading-panel"><img src="layouts/vlayout/modules/Rooms/resources/mini-loader.gif" /></div>');
        urlParams['module'] = 'Rooms';
        urlParams['action'] = 'SaveAjax';
        urlParams['room_type'] = 'Channel';
        urlParams['name'] = channel_name;
        app.request.post({ data: urlParams }).then(function (err, data) {
            if (err === null) {
                if (data._recordId) {
                    thisInstance.load();
                    formElement.find('.collaboration-loading-panel').remove();
                    thisInstance.openRoomDetail(data._recordId);
                }
            } else {
                // to do somethings
                formElement.find('.collaboration-loading-panel').remove();
                aDeferred.reject(err);
            }
        });

        return aDeferred.promise();
    },

    saveDirectMessageRoom: function () {
        var thisInstance = this;
        var aDeferred = jQuery.Deferred();
        var urlParams = {};
        var who = this.container.find('.c-panel-sub-form #who').val();
        if (!who) {
            var params = {
                title: this.vtranslate('JS_CREATE_DIRECT_MESSAGE'),
                text: this.vtranslate('DIRECT_MESSAGE_MEMBER_EMPTY'),
                animation: 'show',
                type: 'error'
            };
            Vtiger_Helper_Js.showPnotify(params);
            return;
        }
        var formElement = thisInstance.container.find('.c-panel-direct-message-form');
        //formElement.progressIndicator({});
        formElement.append('<div class="collaboration-loading-panel"><img src="layouts/vlayout/modules/Rooms/resources/mini-loader.gif" /></div>');
        urlParams['module'] = 'Rooms';
        urlParams['action'] = 'SaveAjax';
        urlParams['room_type'] = 'Direct Message';
        urlParams['members'] = who;

        app.request.post({ data: urlParams }).then(function (err, data) {
            if (err === null) {
                if (data._recordId) {
                    thisInstance.load();
                    formElement.find('.collaboration-loading-panel').remove();
                    thisInstance.openRoomDetail(data._recordId);
                }
            } else {
                // to do somethings
                formElement.find('.collaboration-loading-panel').remove();
                aDeferred.reject(err);
            }
        });

        return aDeferred.promise();
    },

    savePrivateGroupRoom: function () {
        var thisInstance = this;
        var aDeferred = jQuery.Deferred();
        var urlParams = {};
        var group_name = this.container.find('.c-panel-sub-form #private-group-name').val();
        var group_members = this.container.find('.c-panel-sub-form #private-group-members').val();
        /*console.log(group_members);
         return;*/
        if (group_name == '') {
            var params = {
                title: this.vtranslate('JS_CREATE_PRIVATE_GROUP'),
                text: this.vtranslate('PRIVATE_GROUP_NAME_EMPTY'),
                animation: 'show',
                type: 'error'
            };
            Vtiger_Helper_Js.showPnotify(params);
            return;
        }
        if (group_members == '' || group_members === null) {
            var params = {
                title: this.vtranslate('JS_CREATE_PRIVATE_GROUP'),
                text: this.vtranslate('PRIVATE_GROUP_MEMBER_EMPTY'),
                animation: 'show',
                type: 'error'
            };
            Vtiger_Helper_Js.showPnotify(params);
            return;
        }
        var formElement = thisInstance.container.find('.c-panel-private-group-form');
        //formElement.progressIndicator({});
        formElement.append('<div class="collaboration-loading-panel"><img src="layouts/vlayout/modules/Rooms/resources/mini-loader.gif" /></div>');
        urlParams['module'] = 'Rooms';
        urlParams['action'] = 'SaveAjax';
        urlParams['room_type'] = 'Private Group';
        urlParams['name'] = group_name;
        urlParams['members'] = group_members;
        app.request.post({ data: urlParams }).then(function (err, data) {
            if (err === null) {
                if (data._recordId) {
                    thisInstance.load();
                    formElement.find('.collaboration-loading-panel').remove();
                    thisInstance.openRoomDetail(data._recordId);
                }
            } else {
                // to do somethings
                formElement.find('.collaboration-loading-panel').remove();
                aDeferred.reject(err);
            }
        });

        return aDeferred.promise();
    },

    registerOpenRoomDetailEvent: function () {
        var thisInstance = this;
        this.container.find('.c-panel .c-panel-room-title span').on('click', function () {
            var liElement = $(this).closest('li');
            var record = liElement.data('record');
            thisInstance.openRoomDetail(record);
        });
    },

    registerArchiveRoomEvent: function () {
        var thisInstance = this;
        this.container.find('.c-panel .c-panel-room-title .room-archive-btn').on('click', function () {
            var archiveElement = $(this);
            var liElement = archiveElement.closest('li');
            var record = liElement.data('record-user');
            if (record == '' || record == 0) {
                return;
            }
            var aDeferred = jQuery.Deferred();
            var urlParams = {};
            urlParams['module'] = 'RoomsUsers';
            urlParams['action'] = 'SaveAjax';
            urlParams['field'] = 'archived';
            urlParams['value'] = 1;
            urlParams['record'] = record;
            app.request.post({ data: urlParams }).then(function (err, data) {
                if (err === null) {
                    var newArchived = liElement;
                    liElement.remove();
                    newArchived.find('i.room-archive-btn').removeClass('fa fa-eye-slash').removeClass('room-archive-btn').addClass('fa fa-eye').addClass('room-restore-archive-btn').attr('title', thisInstance.vtranslate('LBL_REMOVE_ARCHIVE_TOOLTIP_TITLE'));
                    //newArchived.append('<i class="icon-eye-open pull-right icon-white hide room-restore-archive-btn"></i>');
                    thisInstance.container.find('.c-panel .archived-list ul').append(newArchived);
                    thisInstance.registerOpenRoomDetailEvent();
                    thisInstance.registerRemoveArchiveRoomEvent();
                    thisInstance.registerLeaveRoomEvent();
                } else {
                    // to do somethings
                    aDeferred.reject(err);
                }
            });

            return aDeferred.promise();
        });
    },

    registerRemoveArchiveRoomEvent: function () {
        var thisInstance = this;
        this.container.find('.c-panel .c-panel-room-title .room-restore-archive-btn').on('click', function () {
            var rmArchiveElement = $(this);
            var liElement = rmArchiveElement.closest('li');
            var room_type = liElement.data('room-type');
            var room_type_class = room_type.replace(' ', '-').toLowerCase();
            var record = liElement.data('record-user');
            if (record == '' || record == 0) {
                return;
            }
            var aDeferred = jQuery.Deferred();
            var urlParams = {};
            urlParams['module'] = 'RoomsUsers';
            urlParams['action'] = 'SaveAjax';
            urlParams['field'] = 'archived';
            urlParams['value'] = 0;
            urlParams['record'] = record;
            app.request.post({ data: urlParams }).then(function (err, data) {
                if (err === null) {
                    var newRestoreArchived = liElement;
                    newRestoreArchived.find('i.room-restore-archive-btn').removeClass('fa fa-eye').removeClass('room-restore-archive-btn').addClass('fa fa-eye-slash').addClass('room-archive-btn').attr('title', thisInstance.vtranslate('LBL_ARCHIVE_TOOLTIP_TITLE'));
                    thisInstance.container.find('.c-panel .c-panel-' + room_type_class + ' ul').prepend(newRestoreArchived);
                    thisInstance.registerOpenRoomDetailEvent();
                    thisInstance.registerArchiveRoomEvent();
                    thisInstance.registerLeaveRoomEvent();
                } else {
                    // to do somethings
                    aDeferred.reject(err);
                }
            });

            return aDeferred.promise();
        });
    },

    registerJoinRoomEvent: function (record) {
        var thisInstance = this;
        this.container.find('#c-detail-container .join-btn').on('click', function () {
            var user_record = $(this).data('record');
            if (user_record == '' || user_record == 0) {
                return;
            }
            var parentElement = $(this).closest('.user-join-box');
            parentElement.progressIndicator({});
            var aDeferred = jQuery.Deferred();
            var urlParams = {};
            urlParams['module'] = 'RoomsUsers';
            urlParams['action'] = 'SaveAjax';
            urlParams['field'] = 'room_status';
            urlParams['value'] = 'Joined';
            urlParams['record'] = user_record;
            app.request.post({ data: urlParams }).then(function (err, data) {
                if (err === null) {
                    parentElement.progressIndicator({ 'mode': 'hide' });
                    thisInstance.openRoomDetail(record);
                } else {
                    // to do somethings
                    aDeferred.reject(err);
                }
            });

            return aDeferred.promise();
        });
    },

    registerLeaveRoomEvent: function () {
        var thisInstance = this;
        this.container.find('.c-panel .c-panel-room-title .room-leave-btn').on('click', function () {
            var leaveElement = $(this);
            var liElement = leaveElement.closest('li');
            var record = liElement.data('record-user');
            if (record == '' || record == 0) {
                return;
            }
            var aDeferred = jQuery.Deferred();
            var urlParams = {};
            urlParams['module'] = 'RoomsUsers';
            urlParams['action'] = 'SaveAjax';
            urlParams['field'] = 'room_status';
            urlParams['value'] = 'Leave';
            urlParams['record'] = record;
            app.request.post({ data: urlParams }).then(function (err, data) {
                if (err === null) {
                    liElement.remove();
                    //remove archived
                    if (thisInstance.container.find('.cpanel .c-panel-archived li[data-record-user=' + record + ']').length > 0) {
                        thisInstance.container.find('.cpanel .c-panel-archived li[data-record-user=' + record + ']').remove();
                    }
                    if (thisInstance.container.find('.cpanel .c-panel-favorites li[data-record-user=' + record + ']').length > 0) {
                        thisInstance.container.find('.cpanel .c-panel-favorites li[data-record-user=' + record + ']').remove();
                    }
                } else {
                    // to do somethings
                    aDeferred.reject(err);
                }
            });

            return aDeferred.promise();
        });
    },

    openRoomDetail: function (record, msgid) {
        var thisInstance = this;
        if (record == '' || record == 0) {
            return;
        }
        thisInstance.container.find('.c-details').html('<div class="collaboration-loading"><img src="layouts/vlayout/modules/Rooms/resources/loading.gif" /></div>');
        var aDeferred = jQuery.Deferred();
        var urlParams = {};
        urlParams['module'] = 'Rooms';
        urlParams['view'] = 'Details';
        urlParams['record'] = record;
        app.request.post({ data: urlParams }).then(function (err, data) {
            if (err === null) {
                thisInstance.container.find('.c-details').html(data);
                thisInstance.container.find('.c-details .message-box').animate({ scrollTop: $('.message-box').get(0).scrollHeight }, 0);
                thisInstance.registerSubmitMessage(record);
                thisInstance.registerFavoriteEvent(record);
                thisInstance.registerPushMessages(record);
                thisInstance.registerAttachments(record);
                thisInstance.registerAliasFileInputSelection(record);
                thisInstance.registerUsersTagEvent(record);
                thisInstance.registerSearchMessagesInBox(record);
                thisInstance.registerEmoticonBtnEvent(record);
                thisInstance.registerSelectedEmoticonEvent(record);
                thisInstance.showEmoticonsGraphic();
                thisInstance.registerBBCodeEventNormalBtn(record);
                thisInstance.registerBBCodeEventColorBtn(record);
                thisInstance.registerBBCodeEventSizeBtn(record);
                thisInstance.registerLoadMoreMessages(record);
                thisInstance.registerShowMembersBtn();
                thisInstance.registerAddMembersBtn();
                var roomDetail = thisInstance.container.find('.c-details');
                if (roomDetail.find('#room-status').val() == 'Pending' && roomDetail.find('#room-type').val() == 'Channel') {
                    thisInstance.registerJoinRoomEvent(record);
                }
                roomDetail.find('textarea[name=message]').focus();
                app.storage.set('collaboration_last_room_active_' + app.getUserId(), record);
                if (typeof msgid != undefined) {
                    var params = {};
                    params['id'] = msgid;
                    thisInstance.jumpToMessageItem(record, params);
                }

                thisInstance.showParent(record);
            } else {
                // to do somethings
                thisInstance.container.find('.c-details').html('');
                aDeferred.reject(err);
            }
        });

        return aDeferred.promise();
    },

    showParent: function (record) {
        if (this.container.find('#room-related-record .room-related-record-remove').length == 0) {
            var currentModuleName = app.getModuleName();
            var currentModuleView = app.getViewName();
            var currentRecordId = this.getRecordId();
            var listRelatedModulesString = this.container.find('#list-related-modules').val();
            var listRelatedModules = jQuery.parseJSON(listRelatedModulesString);
            if (currentModuleView == 'Detail' && listRelatedModules.indexOf(currentModuleName) > -1) {
                var thisInstance = this;
                var aDeferred = jQuery.Deferred();
                var urlParams = {};
                urlParams['module'] = 'Rooms';
                urlParams['action'] = 'GetData';
                urlParams['record'] = currentRecordId;
                urlParams['source_module'] = currentModuleName;
                app.request.post({ data: urlParams }).then(function (err, data) {
                    if (err === null) {
                        var parent_label = data.label;
                        thisInstance.container.find('#room-related-record').html('<a href="javascript:void(0)" onclick="Vtiger_Rooms_Js.addParent(' + record + ')">' + thisInstance.vtranslate('LBL_LINK_TO_RECORD_BEGIN') + parent_label + thisInstance.vtranslate('LBL_LINK_TO_RECORD_END') + '</a>');
                    } else {
                        // to do somethings
                        aDeferred.reject(err);
                    }
                });

                return aDeferred.promise();
            }
        }
    },

    addParent: function (record) {
        var thisInstance = this;
        var currentModuleName = app.getModuleName();
        var currentRecordId = thisInstance.getRecordId();
        var aDeferred = jQuery.Deferred();
        var urlParams = {};
        urlParams['module'] = 'Rooms';
        urlParams['action'] = 'RelatedRecord';
        urlParams['record'] = record;
        urlParams['parent_record'] = currentRecordId;
        urlParams['source_module'] = currentModuleName;
        app.request.post({ data: urlParams }).then(function (err, data) {
            if (err === null) {
                var parent_label = data.parent_label;
                thisInstance.container.find('#room-related-record').html('<a href="index.php?module=' + currentModuleName + '&view=Detail&record=' + currentRecordId + '" target="_blank">' + parent_label + '</a><a href="javascript:void(0);" class="room-related-record-remove" onclick="Vtiger_Rooms_Js.removeParent(' + record + ')">x</a>');
            } else {
                // to do somethings
                aDeferred.reject(error);
            }
        });

        return aDeferred.promise();
    },

    removeParent: function (record) {
        var thisInstance = this;
        var currentModuleName = app.getModuleName();
        var currentRecordId = thisInstance.getRecordId();
        var aDeferred = jQuery.Deferred();
        var urlParams = {};
        urlParams['module'] = 'Rooms';
        urlParams['action'] = 'RelatedRecord';
        urlParams['record'] = record;
        urlParams['parent_record'] = '';
        urlParams['source_module'] = '';
        app.request.post({ data: urlParams }).then(function (err, data) {
            if (err === null) {
                thisInstance.container.find('#room-related-record').html('');
                thisInstance.showParent(record);
            } else {
                // to do somethings
                aDeferred.reject(err);
            }
        });

        return aDeferred.promise();
    },

    split: function (val) {
        return val.split(/[@]\s*/);
    },

    extractLast: function (term) {
        return this.split(term).pop();
    },

    registerUsersTagEvent: function (record) {
        var thisInstance = this;
        var availableUsersString = this.container.find('#messageForm' + record + ' #users_tag').val();
        if (typeof availableUsers === 'undefined' || !availableUsers) {
            return;
        }
        var availableUsers = $.parseJSON(availableUsersString);
        this.container.find('#messageForm' + record + ' textarea[name=message]')
            // don't navigate away from the field on tab when selecting an item
            .on("click", function (event) {
                $('colorpicker').hide();
                $('#room-emotion-list').hide();
            }).bind("keydown", function (event) {
                if (event.keyCode === $.ui.keyCode.TAB && $(this).data("autocomplete").menu.active) {
                    event.preventDefault();
                }
            }).autocomplete({
                minLength: 0,
                position: { my: "left bottom", at: "left top", collision: "none" },
                source: function (request, response) {
                    var term = request.term, results = [];
                    if (term.indexOf("@") >= 0) {
                        term = thisInstance.extractLast(request.term);
                        if (term.length > 0) {
                            results = $.ui.autocomplete.filter(
                                availableUsers, term);
                        } else {
                            results = ['Typing...'];
                        }
                    }
                    response(results);
                },
                focus: function () {
                    // prevent value inserted on focus
                    return false;
                },
                select: function (event, ui) {
                    var terms = thisInstance.split(this.value);
                    // remove the current input
                    terms.pop();
                    // add the selected item
                    terms.push(ui.item.value);
                    // add placeholder to get the comma-and-space at the end
                    terms.push("");
                    this.value = '@' + terms.join("") + ': ';
                    return false;
                }
            });
    },

    registerSearchMessagesInBox: function (record) {
        var thisInstance = this;
        this.container.find('input#search_message_internal')
            // don't navigate away from the field on tab when selecting an item
            .bind("keydown", function (event) {
                if (event.keyCode === $.ui.keyCode.TAB && $(this).data("autocomplete").menu.active) {
                    event.preventDefault();
                }
            }).autocomplete({
                minLength: '2',
                html: true,
                position: { my: "right top", at: "right bottom" },
                source: function (request, response) {
                    var term = request.term, results = [];
                    var aDeferred = jQuery.Deferred();
                    var urlParams = {};
                    urlParams['module'] = 'Rooms';
                    urlParams['action'] = 'SearchMessages';
                    urlParams['record'] = record;
                    urlParams['value'] = term;
                    var aDeferred = jQuery.Deferred();
                    app.request.post({ data: urlParams }).then(function (err, data) {
                        if (err === null) {
                            var reponseDataList = [];
                            var serverDataFormat = data;
                            if (serverDataFormat.length <= 0) {
                                serverDataFormat = new Array({
                                    'label': app.vtranslate('JS_NO_RESULTS_FOUND'),
                                    'type': 'no results'
                                });
                            }
                            for (var id in serverDataFormat) {
                                var responseData = serverDataFormat[id];
                                reponseDataList.push(responseData);
                            }
                            response(reponseDataList);
                        } else {
                            // to do somethings
                            aDeferred.reject(err);
                        }
                    });
                },
                focus: function () {
                    // prevent value inserted on focus
                    return false;
                },
                select: function (event, ui) {
                    var selectedItemData = ui.item;
                    thisInstance.jumpToMessageItem(record, selectedItemData);
                    return false;
                }
            });
    },

    registerFavoriteEvent: function (record) {
        var thisInstance = this;
        thisInstance.container.find('.c-details .favorite-action').on('click', function (event) {
            event.preventDefault();
            var element = jQuery(this);
            if (element.data('requestRunning')) {
                return;
            }
            element.data('requestRunning', true);
            var currentFavorite = element.data('favorite');
            var room_id = thisInstance.container.find('.c-details form input[name=room_id]').val();
            var room_title = thisInstance.container.find('.c-details .c-detail-header .room-title').text();
            var urlParams = {};
            urlParams['module'] = 'RoomsUsers';
            urlParams['action'] = 'SaveAjax';
            urlParams['record'] = element.data('record');
            urlParams['field'] = 'favorite';
            if (currentFavorite == 1) {
                urlParams['value'] = 0;
            } else {
                urlParams['value'] = 1;
            }
            var aDeferred = jQuery.Deferred();
            app.request.post({ data: urlParams }).then(function (err, data) {
                if (err === null) {
                    if (currentFavorite == 1) {
                        element.data('favorite', 0);
                        element.removeClass('star-favorite');
                        element.addClass('star-empty');
                        thisInstance.removeFavoritePanel(room_id);

                    } else {
                        element.data('favorite', 1);
                        element.removeClass('star-empty');
                        element.addClass('star-favorite');
                        thisInstance.addFavoritePanel(room_id, room_title);
                    }
                    element.data('requestRunning', false);
                } else {
                    // to do somethings
                    element.data('requestRunning', false);
                    aDeferred.reject(err);
                }
            });

            return aDeferred.promise();
        });
    },

    addFavoritePanel: function (room_id, room_title) {
        var favoriteItem = '';
        favoriteItem += '<li data-record="' + room_id + '" class="c-panel-room-title"><span>';
        favoriteItem += room_title;
        favoriteItem += '</span></li>';
        jQuery('.c-panel-favorites ul').append(favoriteItem);
        this.registerOpenRoomDetailEvent();
    },

    removeFavoritePanel: function (room_id) {
        jQuery('.c-panel-favorites ul li').each(function () {
            if (jQuery(this).data('record') == room_id) {
                jQuery(this).remove();
            }
        });
    },

    registerSubmitMessage: function (record) {
        /**Get user name**/
        var usrTag = $(".full-name").text();
        /**Get avatar**/
        var avatar_alias_html = $(".avatar").text();
        /**Get avatar color**/
        var avatar_alias_bg = $(".avatar span").css("background-color");
        /**Gets the room type: direct message, private group and channel**/
        var room_type = $("#room_type").val();
        /**Get the sender user id**/
        var user_id = $("#user-id").val();
        /**Get the room_id to check between one chat and another**/
        var room_id = $("#room_id").val(); console.log("The expected room id is: " + room_id);

        var room_titles = $(".room-title").text();
        console.log("The expected .room-title is: " + room_titles);

        var receivers = $("#receiver").text();
        console.log("The expected receiver is: " + receivers);

        var littleman = $('ul.navbar-nav .dropdown .pull-right .hidden-sm').text();
        console.log(littleman);

        var thisInstance = this;
        thisInstance.container.find('#messageForm' + record + ' textarea[name=message]').keypress(function (e) {
            if (e.keyCode == 13 && !e.shiftKey) {
                e.preventDefault();
                //now call the code to submit your form
                var messageBox = $(this);
                if ($.trim(messageBox.val()) == '') {
                    return;
                }
                var form = messageBox.closest('form');
                var params = form.serialize();
                messageBox.attr('disabled', 'disabled');
                var aDeferred = jQuery.Deferred();
                var nwMessage = $("#chatMessage").val();

                var data = {
                    message: nwMessage,
                    room_id: room_id,
                    msg_type: "",
                    user_id: user_id,
                    room_type: room_type,
                    usrTag: usrTag,
                    avatar_alias_bg: avatar_alias_bg,
                    avatar_alias_html: avatar_alias_html,
                    room_title: room_titles,
                    littleman: littleman
                };

                AppConnector.request(params).then(function (err) {
                    if (err === null) {
                        var message = thisInstance.buildMessage(data);
                        if (thisInstance.container.find('.c-details .message-box #msg' + data._recordId).length == 0) {
                            thisInstance.container.find('.message-box .message-list').append(message);
                            thisInstance.container.find('.c-details .message-box').animate({ scrollTop: $('.message-box').get(0).scrollHeight }, 0);
                        }
                        thisInstance.container.find('#messageForm' + record + ' textarea[name=message]').val('').focus();
                        thisInstance.showEmoticonsGraphic();
                        messageBox.removeAttr('disabled').focus();
                    } else {

                        messageBox.removeAttr('disabled');
                        aDeferred.reject(err);
                    }
                });

                conn.send(JSON.stringify(data));
                $("#chatMessage").val('');
                messageBox.removeAttr('disabled').focus();

                return aDeferred.promise();
            }

            if (e.keyCode == 13 && (e.shiftKey || e.ctrlKey)) {
                /*var messageBox = $(this);
                 var current_val = messageBox.val();
                 messageBox.val(current_val+"\r\n");*/
            }
        });
    },

    registerAliasFileInputSelection: function (record) {
        this.container.find('#attachmentForm' + record + ' .room-attachment-alias').on('click', function (event) {
            event.preventDefault();
            $(this).closest('form').find('input[type=file]').trigger('click');
        });
    },

    registerAttachments: function (record) {
        /**Get user name**/
        var usrTag = $(".full-name").text();
        /**Get avatar**/
        var avatar_alias_html = $(".avatar").text();
        /**Get avatar color**/
        var avatar_alias_bg = $(".avatar span").css("background-color");

        var thisInstance = this;
        this.container.find('#attachmentForm' + record + ' input[type=file]').on('change', function (event) {
            event.preventDefault();
            var element = $(this);
            var form = $('#attachmentForm' + record);
            var val = $(this).val();
            val.replace(/\\/g, "/");
            var filename = val.substring(val.lastIndexOf("/") + 1);
            //now call the code to submit your form
            var params = {};
            params['module'] = 'RoomsMessages';
            params['action'] = 'SaveAjax';
            params['room_id'] = record;
            params['message'] = filename;
            params['msg_type'] = 'attachment';
            params['attachment'] = 'true';
            var aDeferred = jQuery.Deferred();

            var data = {
                message: filename,
                room_id: record,
                msg_type: "attachment",
                usrTag: usrTag,
                avatar_alias_bg: avatar_alias_bg,
                avatar_alias_html: avatar_alias_html,
            }
            app.request.post({ data: params }).then(function (err, data) {
                if (err === null) {
                    var message = thisInstance.buildMessage(data, 'attachment');
                    if (thisInstance.container.find('.c-details .message-box #msg' + data._recordId).length == 0) {
                        thisInstance.container.find('.message-box .message-list').append(message);
                        thisInstance.container.find('.c-details .message-box').animate({ scrollTop: $('.message-box').get(0).scrollHeight }, 0);

                        //upload file
                        var liElement = thisInstance.container.find('.c-details .message-box #msg' + data._recordId);
                        var progress = liElement.find('.progress');
                        var bar = liElement.find('.bar');
                        var percent = liElement.find('.percent');
                        progress.show();
                        var url = 'index.php?' + form.serialize() + '&record=' + data._recordId;
                        form.ajaxSubmit({
                            'url': url,
                            'type': 'POST',
                            beforeSend: function () {
                                var percentVal = '0%';
                                bar.width(percentVal);
                                percent.html(percentVal);
                            },
                            uploadProgress: function (event, position, total, percentComplete) {
                                var percentVal = percentComplete + '%';
                                bar.width(percentVal);
                                percent.html(percentVal);
                            },
                            complete: function (xhr) {
                                var response = $.parseJSON(xhr.responseText);
                                element.val('');
                                progress.hide();
                                var filename = '<a href="' + response.result.download_link + '">' + response.result.file_name + '</a>';
                                liElement.find('.member-message-body').html(filename);
                            },
                            error: function (xhr, status, error) {
                                progress.hide();
                                liElement.find('.member-message-body').append('-- !error');
                            }
                        });
                    }
                } else {
                    // to do somethings
                    aDeferred.reject(err);
                }
            });
            conn.send(JSON.stringify(data));
            return aDeferred.promise();
        });
    },

    buildMessage: function (data, type) {
        if (typeof type == 'undefined' || type == '') {
            type = data.msg_type.value;
        }
        var message = '';
        message += '<li class="message-item" id="msg' + data._recordId + '">';
        message += '<div class="member-avatar">';
        if (typeof data.avatar != 'undefined' && data.avatar.length > 0) {
            message += '<img src="' + data.avatar + '">';
        } else {
            //message += '<span>' + data.avatar_alias + '</span>';
            message += ' <span style="background-color: ' + data.avatar_alias_bg + '">' + data.avatar_alias_html + '</span>';
        }
        message += '</div>';
        message += '<div class="member-message">';
        message += '<div class="member-message-header">';
        message += '<span class="member-name">' + data.assigned_user_id.display_value + '</span>';
        message += ' <span class="message-item-date">' + data.CreatedTime.display_value + '</span>';
        message += '</div>';
        if (type == 'attachment') {
            message += '<div class="member-message-body"><a href="index.php?module=RoomsMessages&action=DownloadFile&record=' + data._recordId + '">' + data.filename.display_value + '</a></div>';
            message += '<div class="member-message-body">' + data.message.display_value + '</div>';
        } else {
            message += '<div class="member-message-body">' + data.message.display_value + '</div>';
        }
        message += '</div>';
        if (type == 'attachment') {
            message += '<div class="progress" style="display: none;">';
            message += '<div class="bar"></div >';
            message += '<div class="percent">0%</div >';
            message += '</div>';
        }
        message += '</li>';

        return message;
    },

    registerEmoticonBtnEvent: function (record) {
        var thisInstance = this;
        thisInstance.container.find('.room-emotion-btn').on('click', function (event) {
            event.preventDefault();
            var parent = $(this).closest('#room-emotion');
            parent.find('#room-emotion-list').toggle('slide', { direction: 'down' });
        });
    },

    registerSelectedEmoticonEvent: function (record) {
        var thisInstance = this;
        thisInstance.container.find('#room-emotion-list .emoticon').on('click', function (event) {
            event.preventDefault();
            var emoticonVal = $(this).html();
            var parent = $(this).closest('#room-message-form');
            var form = parent.find('#messageForm' + record);
            var textBox = form.find('textarea');
            var pos = textBox.getCursorPosition();
            var content = textBox.val();
            //console.log(content);
            //console.log(pos);
            var newContent = content.substr(0, pos) + " " + emoticonVal + " " + content.substr(pos);
            textBox.val(newContent);
        });
    },

    showEmoticonsGraphic: function () {
        if ($('#c-detail-container .member-message-body').length) {
            $('#c-detail-container .member-message-body').each(function () {
                var msg = $(this).html();
                $(this).html($.emoticons.replace(msg));
            });
        }
    },

    registerBBCodeEventNormalBtn: function (record) {
        var thisInstance = this;
        thisInstance.container.find('#room-message-form .formatting-normal').on('click', function (event) {
            event.preventDefault();
            var parent = $(this).closest('#room-message-form');
            var form = parent.find('#messageForm' + record);
            var textBox = form.find('textarea');
            var selectionStart = textBox.getSelectionStart();
            var selectionEnd = textBox.getSelectionEnd();
            var selectionStr = textBox.getSelection();
            var content = textBox.val();
            var bbcodetype = $(this).data('type');
            var bbcode_type_start = '[' + bbcodetype + ']';
            var bbcode_type_end = '[/' + bbcodetype + ']';
            if (selectionEnd == selectionStart) {
                var bbcodeContent = bbcode_type_start + bbcode_type_end;
            } else {
                var bbcodeContent = bbcode_type_start + selectionStr + bbcode_type_end;
            }

            var newContent = content.substr(0, selectionStart) + bbcodeContent + content.substr(selectionEnd);
            textBox.val(newContent);

            if (bbcodetype == 'url') {
                textBox.setCursorPosition(selectionStart + 5);
            } else {
                textBox.setCursorPosition(selectionStart + 3);
            }
        });
    },

    registerBBCodeEventColorBtn: function (record) {
        var thisInstance = this;
        thisInstance.container.find('#room-message-form .formatting-font-color').ColorPicker({
            flat: false,
            onSubmit: function (hsb, hex, rgb, el) {
                var parent = $(el).closest('#room-message-form');
                var form = parent.find('#messageForm' + record);
                var textBox = form.find('textarea');
                var selectionStart = textBox.getSelectionStart();
                var selectionEnd = textBox.getSelectionEnd();
                var selectionStr = textBox.getSelection();
                var content = textBox.val();
                var bbcode_type_start = '[color=#' + hex + ']';
                var bbcode_type_end = '[/color]';
                if (selectionEnd == selectionStart) {
                    var bbcodeContent = bbcode_type_start + bbcode_type_end;
                } else {
                    var bbcodeContent = bbcode_type_start + selectionStr + bbcode_type_end;
                }
                var newContent = content.substr(0, selectionStart) + bbcodeContent + content.substr(selectionEnd);
                textBox.val(newContent);
                $('.colorpicker').hide();
                textBox.setCursorPosition(selectionStart + 15);
            }
        });
    },

    registerBBCodeEventSizeBtn: function (record) {
        var thisInstance = this;
        this.container.find('#room-message-form .formatting-font-size').on('click', function (event) {
            event.preventDefault();
            $(this).find('.formatting-font-size-list').toggle('slide', { direction: 'down' });
        });
        this.container.find('#room-message-form .formatting-font-size-list li').on('click', function (event) {
            event.preventDefault();
            var fontSize = $(this).find('font').attr('size');
            if (fontSize) {
                var parent = $(this).closest('#room-message-form');
                var form = parent.find('#messageForm' + record);
                var textBox = form.find('textarea');
                var selectionStart = textBox.getSelectionStart();
                var selectionEnd = textBox.getSelectionEnd();
                var selectionStr = textBox.getSelection();
                var content = textBox.val();
                var bbcode_type_start = '[size=' + fontSize + ']';
                var bbcode_type_end = '[/size]';
                if (selectionEnd == selectionStart) {
                    var bbcodeContent = bbcode_type_start + bbcode_type_end;
                } else {
                    var bbcodeContent = bbcode_type_start + selectionStr + bbcode_type_end;
                }
                var newContent = content.substr(0, selectionStart) + bbcodeContent + content.substr(selectionEnd);
                textBox.val(newContent);
                thisInstance.container.find('#room-message-form .formatting-font-list').hide();
                textBox.setCursorPosition(selectionStart + 8);
            }
        });
    },

    registerShowHistoryBoxEvent: function () {
        var thisInstance = this;
        this.container.find('.c-panel .c-panel-history').on('click', function (event) {
            event.preventDefault();
            var aDeferred = jQuery.Deferred();
            var urlParams = {};
            urlParams['module'] = 'Rooms';
            urlParams['view'] = 'History';
            app.request.post({ data: urlParams }).then(function (err, data) {
                if (err === null) {
                    thisInstance.container.find('.c-details').html(data);
                    thisInstance.registerSearchHistoryBoxEvent();
                    vtUtils.applyFieldElementsView(thisInstance.container.find('#collaboration-history'));
                } else {
                    // to do somethings
                    aDeferred.reject(err);
                }
            });

            return aDeferred.promise();
        });
    },

    registerSearchHistoryBoxEvent: function () {
        var thisInstance = this;
        this.container.find('.c-details input#history-search-box').on('keyup', function (event) {
            var val = $(this).val();
            var parentElement = $(this).closest('.collaboration-history-search-box');
            var historyTypeElement = $('#history-type', parentElement);
            var historyTypeValue = historyTypeElement.val();
            if (val.length < 3) {
                thisInstance.container.find('#collaboration-history .collaboration-history-result').html('');
                return;
            }
            var aDeferred = jQuery.Deferred();
            var urlParams = {};
            urlParams['module'] = 'Rooms';
            urlParams['view'] = 'HistoryAjax';
            urlParams['value'] = val;
            urlParams['history_type'] = historyTypeValue;
            app.request.post({ data: urlParams }).then(function (err, data) {
                if (err === null) {
                    thisInstance.container.find('#collaboration-history .collaboration-history-result').html(data);
                    thisInstance.container.find('#collaboration-history .collaboration-history-result li').on('click', function () {
                        if (historyTypeValue == 'M') {
                            thisInstance.openRoomDetail($(this).data('room-id'), $(this).data('record'));
                        } else {
                            thisInstance.openRoomDetail($(this).data('room-id'));
                        }
                    });
                } else {
                    // to do somethings
                    aDeferred.reject(err);
                }
            });

            return aDeferred.promise();
        });
    },

    registerLoadMoreMessages: function (record) {
        var thisInstance = this;
        var loading_more_msg = false;
        $(".message-box").scroll(function () {
            var page_number = thisInstance.container.find('#c-detail-container .c-detail-header input[name=message_page_number]').val();
            var page_end = thisInstance.container.find('#c-detail-container .c-detail-header input[name=message_page_end]').val();
            if ($(this).scrollTop() == 0 && loading_more_msg === false && page_number < page_end) {
                loading_more_msg = true;
                var loading_html = '<li id="loading-more-msg"><img src="layouts/vlayout/modules/Rooms/resources/loading.gif" /></li>';
                thisInstance.container.find('#c-detail-container .message-box .message-list').prepend(loading_html);
                var aDeferred = jQuery.Deferred();
                var urlParams = {};
                urlParams['module'] = 'Rooms';
                urlParams['view'] = 'DetailsAjax';
                urlParams['record'] = record;
                urlParams['page_number'] = page_number;
                app.request.post({ data: urlParams }).then(function (err, data) {
                    if (err === null) {
                        loading_more_msg = false;
                        if (data != '') {
                            thisInstance.container.find('#c-detail-container .c-detail-header input[name=message_page_number]').val(parseInt(page_number) + 1);
                            thisInstance.container.find('#c-detail-container .message-box .message-list').prepend(data);
                        }
                        thisInstance.container.find('#c-detail-container .message-box .message-list').find('#loading-more-msg').remove();
                    } else {
                        // to do somethings
                        loading_more_msg = false;
                        thisInstance.container.find('#c-detail-container .message-box .message-list').find('#loading-more-msg').remove();
                        aDeferred.reject(err);
                    }
                });

                return aDeferred.promise();
            }
        });
    },

    jumpToMessageItem: function (record, selectedItemData) {
        var thisInstance = this;
        if (selectedItemData.id) {
            if (thisInstance.container.find("li#msg" + selectedItemData.id).length > 0) {
                var msgBox = thisInstance.container.find('.message-box');
                var msgElement = msgBox.find("li#msg" + selectedItemData.id);
                msgBox.find('.message-list .message-item').removeClass('hovered');
                msgBox.animate({ scrollTop: msgElement.offset().top - msgBox.offset().top + msgBox.scrollTop() }, 'slow');
                msgElement.toggleClass('hovered');
                thisInstance.container.find('input#search_message_internal').val('');
            } else {
                var loading_html = '<li id="loading-more-msg"><img src="layouts/vlayout/modules/Rooms/resources/loading.gif" /></li>';
                thisInstance.container.find('#c-detail-container .message-box .message-list').prepend(loading_html);
                var aDeferred = jQuery.Deferred();
                var page_number = thisInstance.container.find('#c-detail-container .c-detail-header input[name=message_page_number]').val();
                var page_end = thisInstance.container.find('#c-detail-container .c-detail-header input[name=message_page_end]').val();
                if (page_number == page_end) {
                    return;
                }
                var urlParams = {};
                urlParams['module'] = 'Rooms';
                urlParams['view'] = 'DetailsAjax';
                urlParams['record'] = record;
                urlParams['page_number'] = page_number;
                app.request.post({ data: urlParams }).then(function (err, data) {
                    if (err === null) {
                        if (data != '') {
                            thisInstance.container.find('#c-detail-container .c-detail-header input[name=message_page_number]').val(parseInt(page_number) + 1);
                            thisInstance.container.find('#c-detail-container .message-box .message-list').prepend(data);
                        }
                        thisInstance.container.find('#c-detail-container .message-box .message-list').find('#loading-more-msg').remove();
                        thisInstance.jumpToMessageItem(record, selectedItemData);
                    } else {
                        // to do somethings
                        thisInstance.container.find('#c-detail-container .message-box .message-list').find('#loading-more-msg').remove();
                        aDeferred.reject(error);
                    }
                });

                return aDeferred.promise();
            }
        }
    },

    /**
     * Function returns translated string
     */
    vtranslate: function (key) {
        if (Vtiger_Rooms_Js.languageString[key] != undefined) {
            return Vtiger_Rooms_Js.languageString[key];
        } else {
            if (this.container) {
                var strings = this.container.find('#collaboration_js_strings').text();
                if (strings != '') {
                    Vtiger_Rooms_Js.languageString = JSON.parse(strings);
                    if (key in Vtiger_Rooms_Js.languageString) {
                        return Vtiger_Rooms_Js.languageString[key];
                    }
                }
            }

        }
        return key;
    },

    registerShowMembersBtn: function () {
        var thisInstance = this;
        if (this.container.find('#member-in-room').length > 0) {
            this.container.find('#member-in-room').on('click', function (e) {
                if (jQuery(e.target).is('button')) {
                    $(this).trigger('click');
                    return;
                }
                $(this).find('.members-in-room').toggle('slide', { direction: 'up' });
            });

            thisInstance.container.find('#member-in-room button').on('click', function (event) {
                event.preventDefault();
                var is_owner = thisInstance.container.find('#c-detail-container .c-detail-header h2 #member-is-owner').val();
                if (is_owner == 1) {
                    var parent = $(this).closest('#c-detail-container');
                    var room_id = parent.find('input#room-id').val();
                    var record = $(this).data('record');
                    $(this).attr('disabled');
                    var aDeferred = jQuery.Deferred();
                    var urlParams = {};
                    urlParams['module'] = 'RoomsUsers';
                    urlParams['action'] = 'SaveAjax';
                    urlParams['field'] = 'room_status';
                    urlParams['value'] = 'Reject';
                    urlParams['record'] = record;
                    app.request.post({ data: urlParams }).then(function (err, data) {
                        if (err === null) {
                            thisInstance.openRoomDetail(room_id);
                        } else {
                            // to do somethings
                            aDeferred.reject(err);
                        }
                    });
                }
            });
        }
    },

    registerAddMembersBtn: function () {
        var thisInstance = this;

        $('#members option').on('click', function (event) {
            event.preventDefault();
            var parent = $(this).closest('#c-detail-container');
            var room_id = parent.find('input#room-id').val();
            var user_id = $(this).data('userid');
            $(this).attr('disabled');
            var aDeferred = jQuery.Deferred();
            var urlParams = {};
            urlParams['module'] = 'RoomsUsers';
            urlParams['action'] = 'SaveAjax';
            urlParams['room_status'] = 'Joined';
            urlParams['assigned_user_id'] = user_id;
            urlParams['room_id'] = room_id;
            app.request.post({ data: urlParams }).then(function (err, data) {
                if (err === null) {
                    thisInstance.openRoomDetail(room_id);
                } else {
                    // to do somethings
                    aDeferred.reject(err);
                }
            });
        });
    },

    /**
     * Function returns the record id
     */
    getRecordId: function () {
        var view = app.getViewName();
        var recordId;
        if (view == "Edit") {
            recordId = jQuery('[name="record"]').val();
        } else if (view == "Detail") {
            recordId = jQuery('#recordId').val();
        }
        return recordId;
    },

    registerEvents: function () {
        $('head').append('<link rel="stylesheet" href="layouts/v7/modules/Rooms/resources/emoticons.css">');
        $('head').append('<link rel="stylesheet" href="libraries/jquery/colorpicker/css/colorpicker.css">');
        $('head').append('<link rel="stylesheet" href="layouts/v7/modules/Rooms/resources/Rooms.css">');
        $.loadScript('layouts/v7/modules/Rooms/resources/emoticons.js', function () {
            console.log("load emoticons")
        });
        $.loadScript('libraries/jquery/colorpicker/js/colorpicker.js', function () {
            console.log("load colorpicker")
        });
        var headerLinkBox = $('#navbar');
        var headerLinkContainer = headerLinkBox.find('ul.navbar-nav');
        var collaboration = '<li><div>';
        collaboration += '<a id="c-notification-icon" href="javascript:void(0);" class="fa fa-comments-o">';
        collaboration += '<small title="0 New Message">0</small>';
        collaboration += '</a>';
        collaboration += '<div id="collaboration-home"></div>';
        collaboration += '</div></li>';
        headerLinkContainer.prepend(collaboration);

        this.registerEventNotification();
        this.addRelatedTab();
    }
};

jQuery(document).ready(function () {
    var thisInstance = $(this);
    Vtiger_Rooms_Js.registerPushNotification();
    Vtiger_Rooms_Js.registerEvents();

    var params = {
        'module': 'Rooms',
        'action': 'GetConf'
    }

    AppConnector.request(params).then(
        function (data) {
            conn = new WebSocket(data.result["socketurl"]);
            conn.onopen = function (e) {
                console.log('Connection established!');
            }
            conn.onmessage = function (e) {
                var data = JSON.parse(e.data);
                var rooms_id = $("#room_id").val();
                console.log("The received room id is: " + rooms_id);
                var room_titles = $(".room-title").text();
                console.log("The received .room-title is: " + room_titles);
                var receivers = $("#receiver").text();
                console.log("The received user is: " + receivers);

                var message = '';
                if (data.room_type == 'Direct Message' && data.room_id == rooms_id) {
                    message += '<li class="message-item" id="msg' + data._recordId + '">';
                    message += '<div class="member-avatar">';
                    message += ' <span style="background-color: ' + data.avatar_alias_bg + '">' + data.avatar_alias_html + '</span>';
                    message += '</div>';
                    message += '</div>';
                    message += '<div class="member-message">';
                    message += '<div class="member-message-header">';
                    message += '<span class="member-name">' + data.usrTag + '</span>';
                    message += '<span class="message-item-date" style="margin-left: 2px;">' + data.time + '</span>';
                    message += '</div>';
                    if (data.msg_type == 'attachment') {
                        // message += '<div class="member-message-body"><a href="index.php?module=RoomsMessages&action=DownloadFile&record=' + data.message + '">' + data.message + '</a></div>';
                    } else {
                        message += '<div class="member-message-body">' + data.message;
                        message += '<span class="emptyed" style="display: none;" >' + data.emptynum + '</span>';
                        message += '</div>';
                    }
                    message += '</li>';

                } else if (data.room_type == 'Private Group' && data.room_id == rooms_id) {
                    message += '<li class="message-item" id="msg' + data._recordId + '">';
                    message += '<div class="member-avatar">';
                    message += ' <span style="background-color: ' + data.avatar_alias_bg + '">' + data.avatar_alias_html + '</span>';
                    message += '</div>';
                    message += '</div>';
                    message += '<div class="member-message">';
                    message += '<div class="member-message-header">';
                    message += '<span class="member-name">' + data.usrTag + '</span>';
                    message += '<span class="message-item-date" style="margin-left: 2px;">' + data.time + '</span>';
                    message += '</div>';
                    if (data.msg_type == 'attachment') {
                        // message += '<div class="member-message-body"><a href="index.php?module=RoomsMessages&action=DownloadFile&record=' + data.message + '">' + data.message + '</a></div>';
                    } else {
                        message += '<div class="member-message-body">' + data.message + '</div>';
                    }
                    message += '</li>';

                } else if (data.room_type == 'Channel' && data.room_id == rooms_id) {
                    message += '<li class="message-item" id="msg' + data._recordId + '">';
                    message += '<div class="member-avatar">';
                    message += ' <span style="background-color: ' + data.avatar_alias_bg + '">' + data.avatar_alias_html + '</span>';
                    message += '</div>';
                    message += '</div>';
                    message += '<div class="member-message">';
                    message += '<div class="member-message-header">';
                    message += '<span class="member-name">' + data.usrTag + '</span>';
                    message += '<span class="message-item-date" style="margin-left: 2px;">' + data.time + '</span>';
                    message += '</div>';
                    if (data.msg_type == 'attachment') {
                        // message += '<div class="member-message-body"><a href="index.php?module=RoomsMessages&action=DownloadFile&record=' + data.message + '">' + data.message + '</a></div>';
                    } else {
                        message += '<div class="member-message-body">' + data.message + '</div>';
                    }
                    message += '</li>';
                }
                else {
                    var noti = $(".c-panel-sub-available .c-panel-room-title .unread-number-" + data.room_id).text();

                    if (noti == '') {
                        noti = 0;
                    }
                    noti++;

                    $('.c-panel-sub-available .c-panel-room-title .unread-number-' + data.room_id).html('<small>' + noti + '</small>');

                    var balloon = $('ul.navbar-nav #c-notification-icon').text();

                    balloon++;

                    $('ul.navbar-nav #c-notification-icon').html('<small title="' + noti + ' New Message" id="room-id' + data.room_id + '">' + balloon + '</small>');
                }

                $(".message-list").append(message);

                /**Notificaciones cuando el chat está cerrado**/
                if ($("#collaboration-home").css('display') == 'none') {
                    app.helper.showSuccessNotification({
                        title: `<div style="width: 200px;">
                                New message from:<br>
                                <p><span style="background-color:${data.avatar_alias_bg}; border: 2px inset black;">
                                ${data.avatar_alias_html}
                                </span></p>
                                <p>${data.usrTag}</p>
                                ${data.time}<br>`,
                        message: `${data.message}
                                 </div>`
                    });/*
                    if (room_titles === data.littleman) {
                        var balloon = $('ul.navbar-nav #c-notification-icon').val();

                        if (balloon >= 0) {
                            balloon++;
                        }
            
                        $('ul.navbar-nav #c-notification-icon').html('<small title="' + balloon + ' New Message" id="room-id' + data.room_id + '">' + balloon + '</small>');
                    }*/
                }
                $(".c-details .message-box").animate({ scrollTop: $(".message-box").get(0).scrollHeight }, 0);
            }
        });
});
jQuery.loadScript = function (url, callback) {
    jQuery.ajax({
        url: url,
        dataType: 'script',
        success: callback,
        async: true
    });
}