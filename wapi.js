openChatAt

    window.WAPI_ = {}
    window.WAPI_.checkNumberStatus_V2 = async function(chatId, done) {
        let data
        try {
            if (chatId && (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us'))) {
                chatId += chatId.length > 15 ? '@g.us' : '@c.us'
            }
            const wid = window.Store.WidFactory.createWid(chatId);
            const result = await window.Store.QueryExist(wid);
            // console.log(result);
            if (!result || result.wid === undefined) data = { result: null, error: 'not found' };
            data = { result: result.wid, error: null };
        } catch (e) {
            // console.log(e.message)
            data = { result: null, error: e.message }
        }
        if (done) done(data);
        return data
    };
    window.WAPI_.checkNumberStatus_V3 = async function(chatId, done) {
        let data
        try {
            if (chatId && (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us'))) {
                chatId += '@c.us'
            }

            const result = await WPP.contact.queryExists(chatId)

            if (!result || result.wid === undefined) data = { result: null, error: 'not found' };
            data = { result: result.wid, error: null };
        } catch (e) {
            // console.log(e.message)
            data = { result: null, error: e.message }
        }
        if (done) done(data);
        return data
    };
    window.WAPI_.getLoadMessagesChat_V2 = async function(id, more = false, includeMe = true, done) {
        let data
        let msgs;
        let output = [];
        let isNext = false;
        try {
            if (id && (!id.endsWith('@c.us') || !id.endsWith('@g.us'))) {
                id += id.length > 15 ? '@g.us' : '@c.us'
            }
            const chat = window.WAPI.getChat(id);
            isNext = !chat.msgs.msgLoadState.noEarlierMsgs
            if (more) {
                msgs = await window.Store.ConversationMsgs.loadEarlierMsgs(chat);
            } else {
                msgs = chat.msgs.getModelsArray()
            }
            if (msgs) {
                for (const m of msgs) {
                    output.push(window.WAPI._serializeMessageObj(m))
                }
            }

            data = { result: output, isNext: isNext, error: null };
        } catch (e) {
            data = { result: output, error: e.message, isNext: isNext }
        }
        if (done) done(data);
        return data
    };
    window.WAPI_.stopAutoReplay_V2 = function(done) {
        window.Store.Msg._events.add = []
        if (done) done();
    }
    window.WAPI_.startAutoReplay_V2 = function(done) {
        window.Store.Msg.on('add', async(msg) => {

            let chatId = msg.from._serialized || msg.from

            if (msg && msg.isNewMsg && !msg.isSentByMe) {
                //for read state
                if (msg.ack && msg.ack > 2) {} else if (msg.isGroupMsg) {}
                // else if (msg.isMedia) {}
                // else if (msg.type && msg.type !== "chat") {}
                else if (!msg.body) {
                    console.log("no body")
//                    console.log(msg)
                }
                else {
                    let messages = []
                    let replays = JSON.parse(localStorage.getItem("replays"));
                    Object.keys(replays).map(function(key, index) {
                        key.split(',').map((k) => {
                            if (msg.body.includes(k.replace(/\s/g, ''))) {
                                messages.push(replays[key])
                            }
                        })
                    });
                    try {
                        await window.WAPI.sendSeen(chatId);
                    } catch (e) {
                        console.log(e.message)
                    }
                    messages = [...new Set(messages)];
                    for (const message of messages) {
//                        console.log(chatId)
                        if ("text" === message.message_type || ("button" === message.message_type && !message.media)) {
                            console.log(await window.WAPI.sendButtonsWithText_V2(chatId, message))
                        } else if (("button" === message.message_type && message.media) || "file" === message.message_type) {
                            console.log(await window.WAPI.sendButtonsWithFile_V2(chatId, message))
                        } else if ("list" === message.message_type) {

                            console.log(await window.WAPI.sendList_V2(chatId, message))
                        }
                    }
                }
            }
        })
        if (done) done();
    }
    window.WAPI_.updateReplay_V2 = function(replays = {}, done) {
        localStorage.setItem("replays", JSON.stringify(replays));
        if (done) done();
    }
    window.WAPI_.sendMessage_V4 = async function sendFileInput(chatId, caption, options = {}, done) {
        let data;
        let media;
        if (chatId && (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us'))) {
            chatId += chatId.length > 15 ? '@g.us' : '@c.us'
        }
        try {

            let chat = window.WAPI.getChat(chatId);
            if (!chat){
            let chat = window.WAPI.getChat(chatId);
            }
            if (chat) {
                if (options.media && options.filename) {
                    const forceDocument = options.sendMediaAsDocument || false
                    const mediaBlob = window.WAPI.base64ImageToFile(options.media, options.filename);
                    const mData = await window.Store.OpaqueData.createFromData(mediaBlob, mediaBlob.type);
                    const media = window.Store.MediaPrep.prepRawMedia(mData, { asDocument: forceDocument });
                    const result = await media.sendToChat(chat, { caption: caption })

                    data = { 'result': result !== 'ERROR_UNKNOWN' ? result : null, error: result === 'ERROR_UNKNOWN' ? result : null };
                } else {
                    const result = await window.Store.SendTextMsgToChat(chat, caption)
                    data = { 'result': result };
                }
            } else {
                data = { 'error': "Chat NOT FOUND" };
            }

        } catch (e) {
            data = { 'error': e.message };
        }

        if (done) done(data);
        return data

    }
        window.WAPI_.sendMessage_V5 = async function (chatId, caption, options = {}, done) {
        let data;
        let media;
        if (chatId && (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us'))) {
            chatId += chatId.length > 15 ? '@g.us' : '@c.us'
        }
        try {

                if (options.media) {
                    const forceDocument = options.sendMediaAsDocument || false
                    const a = await WPP.chat.sendFileMessage(chatId, options.media, {
                            caption:caption,
                            type: "auto-detect",
                            createChat: true
                            })
                    data = { result: "success" === (await a.sendMsgResult).messageSendResult || "OK" === (await a.sendMsgResult).messageSendResult }
                } else {
                    const a = await WPP.chat.sendTextMessage(chatId, caption, {
                      createChat: true
                    });
                    data = { result: "success" === (await a.sendMsgResult).messageSendResult || "OK" === (await a.sendMsgResult).messageSendResult }

                }


        } catch (e) {
            data = { 'error': e.message };
        }

        if (done) done(data);
        return data

    }
    window.WAPI_.openChat_V2 = async function(chatId, done) {
        let data;
        if (chatId && (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us'))) {
            chatId += chatId.length > 15 ? '@g.us' : '@c.us'
        }

//        const chat = window.WAPI.getChat(chatId)
//        if (chat) {
        try {
            const res = await window.WPP.chat.openChatBottom(chatId)
            data = { result: res }
        } catch (e) {
            data = { error: e.message }
        }
//        } else {
//            data = { error: "Chat NOT FOUND" }
//        }

        if (done) done(data);
        return data

    }
    window.WAPI_.closeChat_v2 = function(done) {
        window.Store.Cmd.closeChat(window.Store.Chat.getActive())
        if (done) done();
    }
    window.WAPI_.chatInfoDrawer_v2 = function(done) {
            window.Store.Cmd.chatInfoDrawer(window.Store.Chat.getActive())
            if (done) done();
        }
        /**
         * buttons max 3 text and 2 link or phoneNumber
         * @param chatId
         * @param option
         * @param done
         * @returns {Promise<{error: string}|{result: boolean}>}
         */
    window.WAPI_.sendTest_V2 = async function(chatId, option, done) {
        let data;
        try {
            if (chatId && (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us'))) {
                chatId += chatId.length > 15 ? '@g.us' : '@c.us'
            }

            let text = "text?text:''"
            const chat = window.WAPI.getChat(chatId);
            if (chat && 404 != chat.status && chat.id) {
                const meUser = window.Store.User.getMaybeMeUser();
                const isMD = window.Store.MDBackend;

                const newMsgId = new window.Store.MsgKey({
                    from: meUser,
                    to: chat.id,
                    id: window.Store.MsgKey.newId(),
                    participant: isMD && chat.id.isGroup() ? meUser : undefined,
                    selfDir: 'out',
                });

                let s = {
                    id: newMsgId,
                    ack: 1,
                    from: meUser,
                    to: chat.id,
                    local: true,
                    self: "out",
                    t: parseInt((new Date).getTime() / 1e3),
                    isNewMsg: true,
                    type: "chat",
                    body: text,
                    caption: text,
                    content: text,
                    isForwarded: false,
                    broadcast: false,
                };
                let r = (await Promise.all(window.Store.addAndSendMsgToChat(chat, s)));
                data = { result: "success" === r[1] || "OK" === r[1] }

            } else {
                data = { error: "Chat NOT FOUND" }
            }
        } catch (e) {
            data = { error: e.message }
        }

        if (done) done(data);
        return data
    }

    window.WAPI_.sendButtons_V2 = async function(chatId, option, done) {
        let data;
        try {
            if (chatId && (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us'))) {
                chatId += chatId.length > 15 ? '@g.us' : '@c.us'
            }

            const buttons = option.buttons
            const title = option.title
            const footer = option.footer
            let text = option.message
            text = text ? text : ''
            const chat = window.WAPI.getChat(chatId);
            if (chat && 404 != chat.status && chat.id) {
                const meUser = window.Store.User.getMaybeMeUser();
                const isMD = window.Store.MDBackend;

                const newMsgId = new window.Store.MsgKey({
                    from: meUser,
                    to: chat.id,
                    id: window.Store.MsgKey.newId(),
                    participant: isMD && chat.id.isGroup() ? meUser : undefined,
                    selfDir: 'out',
                });

                // const e = await window.WAPI.getNewMessageId(chat.id._serialized),
                let s = {
                    id: newMsgId,
                    ack: 1,
                    from: meUser,
                    to: chat.id,
                    local: true,
                    self: "out",
                    t: parseInt((new Date).getTime() / 1e3),
                    isNewMsg: true,
                    type: "chat",
                    body: text,
                    caption: text,
                    content: text,
                    isForwarded: false,
                    broadcast: false,
                    isQuotedMsgAvailable: false,
                    shouldEnableHsm: true,
                    __x_hasTemplateButtons: true,
                    invis: true,
                };
                let a = await WPP.chat.prepareMessageButtons({
                    "phone": new Store.WidFactory.createWid(chat.id),
                    "message": text,
                    "options": {
                        "useTemplateButtons": true,
                        "buttons": buttons,
                    }
                }, {
                    "useTemplateButtons": true,
                    "buttons": buttons,
                    "title": title,
                    "footer": footer,
                });
                Object.assign(s, a);
                let r = (await Promise.all(window.Store.addAndSendMsgToChat(chat, s)));
                data = { result: "success" === r[1] || "OK" === r[1] }

            } else {
                data = { error: "Chat NOT FOUND" }
            }
        } catch (e) {
            data = { error: e.message }
        }

        if (done) done(data);
        return data
    }

    window.WAPI_.sendFile_V5 = async function(chatId, options, done) {
        let data;
        try {
            if (chatId && (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us'))) {
                chatId += chatId.length > 15 ? '@g.us' : '@c.us'
            }

            const a = await WPP.chat.sendFileMessage(
                chatId,
                options.media
            );
            data = { result: "success" === (await a.sendMsgResult).messageSendResult || "OK" === (await a.sendMsgResult).messageSendResult }

        } catch (e) {
            data = { error: e.message }
        }

        if (done) done(data);
        return data
    }
    window.WAPI_.sendButtonsWithFile_V2 = window.WAPI.sendFile_V5
//    async function(chatId, options, done) {
//        let data;
//        try {
//            if (chatId && (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us'))) {
//                chatId += chatId.length > 15 ? '@g.us' : '@c.us'
//            }
//            let isButton = Array.isArray(options.buttons) && 5 >= options.buttons.length >= 1
//            let useTemplateButton = Array.isArray(options.buttons) && 5 >= options.buttons.length >= 1
//            if (options.useTemplateButton == "false") {
//                useTemplateButton = false
//            }
//            console.log(useTemplateButton)
//            let s = {
//                createChat: true,
//                useTemplateButtons: useTemplateButton,
//                type: options.type,
//                footer: options.footer,
//                caption: options.message || '',
//            }
//            if (isButton) {
//                s['buttons'] = options.buttons
//            }
//
//            const a = await WPP.chat.sendFileMessage(
//                chatId,
//                options.media, s
//            );
//            data = { result: "success" === (await a.sendMsgResult).messageSendResult || "OK" === (await a.sendMsgResult).messageSendResult }
//
//        } catch (e) {
//            data = { error: e.message }
//        }
//
//        if (done) done(data);
//        return data
//    }

    window.WAPI_.sendText_V5 = async function(chatId, options, done) {
        let data = {};
        try {
            if (chatId && (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us'))) {
                chatId += chatId.length > 15 ? '@g.us' : '@c.us'
            }

            const a = await WPP.chat.sendTextMessage(
                chatId,
                options.message,
            );
            data = { result: "success" === (await a.sendMsgResult).messageSendResult || "OK" === (await a.sendMsgResult).messageSendResult }
        } catch (e) {
            console.log(e)
            data = { error: e.message }
        }

        if (done) done(data);
        return data
    }
    window.WAPI_.sendButtonsWithText_V2 = window.WAPI.sendText_V5
//    async function(chatId, options, done) {
//        let data = {};
//        try {
//            if (chatId && (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us'))) {
//                chatId += chatId.length > 15 ? '@g.us' : '@c.us'
//            }
//            let isButton = Array.isArray(options.buttons) && 5 >= options.buttons.length >= 1
//            let useTemplateButton = Array.isArray(options.buttons) && 5 >= options.buttons.length >= 1
//            if (options.useTemplateButton == "false") {
//                useTemplateButton = false
//            }
//            console.log(useTemplateButton)
//            let s = {
//                createChat: true,
//                useTemplateButtons: useTemplateButton,
//                footer: options.footer,
//                title: options.title,
//            }
//
//            if (isButton) {
//                s['buttons'] = options.buttons
//            }
//
//            const a = await WPP.chat.sendTextMessage(
//                chatId,
//                options.message, s
//            );
//            data = { result: "success" === (await a.sendMsgResult).messageSendResult || "OK" === (await a.sendMsgResult).messageSendResult }
//        } catch (e) {
//            console.log(e)
//            data = { error: e.message }
//        }
//
//        if (done) done(data);
//        return data
//    }

    /**
     * @param chatId
     * @param option
     * Sections options must have between 1 and 10 options
     * @param done
     * @returns {Promise<{error: string}|{result: boolean}>}
     */
    window.WAPI_.sendList_V2 = async function(chatId, option, done) {
        let data
        try {
            if (chatId && (!chatId.endsWith('@c.us') && !chatId.endsWith('@g.us'))) {
                chatId += chatId.length > 15 ? '@g.us' : '@c.us'
            }
            const buttonText = option.buttonText || "ارسل"
            const description = option.description || option.message
            const section = option.sections
            const title = option.title
            const footer = option.footer

            const chat = window.WAPI.getChat(chatId);
            if (chat && 404 != chat.status && chat.id) {
                let n = {
                    "buttonText": buttonText,
                    "description": description,
                    "sections": section,
                    "title": title,
                    "footer": footer,
                }
                const a = await WPP.chat.sendListMessage(chat.id, n);

                data = { result: "success" === (await a.sendMsgResult).messageSendResult || "OK" === (await a.sendMsgResult).messageSendResult }
            } else {
                data = { error: "Chat NOT FOUND" }
            }
        } catch (e) {
            console.log(e)
            data = { error: e.message }
        }

        if (done) done(data);
        return data
    }

    window.WAPI_.getChats_V2 = async function(options = {}, done) {
        let data;
        let option = {};
        if (options instanceof Object) {
            option.onlyUsers = options.onlyUsers
            option.onlyGroups = options.onlyGroups
            option.withLabels = options.withLabels
        }
        data = await WPP.chat.list(option)
        data = data.map((e) => {
            return {
                id: e.id.user,
                // name:e.__x_formattedTitle,
                isGroup: e.isGroup,
                isMyContact: e.__x_contact.isMyContact,
                __x_displayName: e.__x_contact.formattedName||e.__x_contact.__x_verifiedName||e.__x_contact.__x_name||e.__x_contact.__x_pushname||e.__x_contact.formattedName
            }
        });
        if (done) done(data);
        return data
    }

    window.WAPI_.getGroupParticipants_V2 = function(id, done) {
        let data;
        if (id && (!id.endsWith('@g.us'))) {
            id += '@g.us'
        }
        let metadata = window.Store.GroupMetadata.get(id);
        if (metadata) {
            data = metadata.participants.map((e) => {
                return {
                    id: e.id.user,
                    isAdmin:e.isAdmin,
                    // name:e.__x_formattedTitle,
                    isGroup: e.isGroup,
                    isMyContact: e.__x_contact.isMyContact,
                    __x_displayName: e.__x_contact.formattedName||e.__x_contact.__x_displayName||e.__x_contact.__x_verifiedName||e.__x_contact.__x_name||e.__x_contact.__x_pushname||e.__x_contact.formattedName
                }
            });
        }
        if (done) done(data);
        return data
    };

    window.WAPI_.getGroupInfoFromInviteCode_V2 = async function(inviteCode, done) {
        let data = {}
        if (inviteCode && inviteCode !== "") {
            try {
                data = await WPP.group.getGroupInfoFromInviteCode(inviteCode);
            } catch (e) {
                data = { "error": e.message }
            }
        } else {
            data = { "error": "Invalid Invite Code" }
        }
        if (done) done(data);
        return data
    }

    window.WAPI_.joinGroupFromInviteCode_V2 = async function(inviteCode, done) {
        let data = {}
        if (inviteCode && inviteCode !== "") {
            try {
                data = await WPP.group.join(inviteCode);
            } catch (e) {
                data = { "error": e.message }
            }
        } else {
            data = { "error": "Invalid Invite Code" }
        }
        if (done) done(data);
        return data
    }

    window.WAPI_.canAddToGroup_V2 = async function(id, done) {
        let data = {}
        if (id && (!id.endsWith('@g.us'))) {
            id += '@g.us'
        }

        try {
            let r = await WPP.group.canAdd(id);
            data = { "result": r }
        } catch (e) {
            data = { "error": e.message }
        }

        if (done) done(data);
        return data
    }
    window.WAPI_.addToGroup_V2 = async function(idGroup, ids, done) {
        let data = {}
        if (idGroup && (!idGroup.endsWith('@g.us'))) {
            idGroup += '@g.us'
        }

        try {
            let r = await WPP.group.addParticipants(idGroup, ids);
            data = { "result": r }
        } catch (e) {
            data = { "error": e.message }
        }

        if (done) done(data);
        return data
    }
    window.WAPI_.createGroup_V2 = async function(name, done) {
        let data = {}
        try {
            let r = await WPP.group.create(name, []);
            data = { "result": r }
        } catch (e) {
            data = { "error": e.message }
        }

        if (done) done(data);
        return data
    }

    window.WAPI_.getAllContacts_V2 = async function(option, done) {
        let data;
        option = option instanceof Object ? option : {}
        data = await WPP.contact.list(option)
        data = data.map((e) => {

            return {
                id: e.id.user,
                name: e.__x_formattedTitle,
                isGroup: e.isGroup,
                isMyContact: e.isMyContact,
                __x_displayName: e.__x_contact.formattedName||e.__x_displayName||e.__x_contact.__x_name||e.__x_contact.__x_verifiedName||e.__x_contact.__x_pushname,
                __x_contact: e.__x_contact.formattedName||e.__x_contact.__x_displayName||e.__x_contact.__x_verifiedName||e.__x_contact.__x_name||e.__x_contact.__x_pushname||e.__x_contact.formattedName,
                __x_notifyName: e.__x_contact.__x_notifyName,
            }
        });
        if (done) done(data);
        return data
    }
    window.WAPI_.getLabels_V2 = (done) => {
        const labels = window.Store.Label.getModelsArray();
        let data = labels.map(label => label.serialize());
        if (done) done(data);
        return data
    };


