window.app = {
	
	
	nettyServerUrl:'ws://39.108.229.47:8088/ws',
	
	
	serverUrl: "http://39.108.229.47:8080/",
	
	
		/**
	 * 图片服务器的url地址
	 */
	imgServerUrl: 'http://39.108.229.47:88/zh/',
	
	
	/**
	 * 判断字符串是否为空
	 * @param {Object} str
	 * true：不为空
	 * false：为空
	 */
	isNotNull: function(str){
		if(str != null && str != "" && str != undefined){
			return true;
		}
		return false;
	},
	/**
	 * 封装消息提示框，默认mui的不支持居中和自定义icon，所以使用h5+
	 * @param {Object} msg
	 * @param {Object} type
	 */
	showToast: function(msg, type){
		plus.nativeUI.toast(msg,{icon:"image/" + type + ".png",verticalAlign: "center"})
	},
	
		/**
	 * 保存用户的全局对象
	 * @param {Object} user
	 */
	setUserGlobalInfo: function(user){
		var userInfoStr = JSON.stringify(user);
		plus.storage.setItem("userInfo",userInfoStr);
	},
		/**
	 * 获取用户的全局对象
	 */
	getUserGlobalInfo: function(){
		var userInfoStr = plus.storage.getItem("userInfo");
		return JSON.parse(userInfoStr);
	},
	
	//登出 清除用户全局对象
	userLogout: function(){
		plus.storage.removeItem("userInfo");
	},
	
	//保存用户的联系人方式
	setContactList: function(contactList){
		var contactListStr = JSON.stringify(contactList);
		plus.storage.setItem("contactList",contactListStr);
	},
	
	
	//检测是值否是网页
	CheckUrl: function(url){
 		var reg=/^([hH][tT]{2}[pP]:\/\/|[hH][tT]{2}[pP][sS]:\/\/)(([A-Za-z0-9-~]+)\.)+([A-Za-z0-9-~\/])+$/;
 		if(!reg.test(url)){
 			alert("这网址不是以http://https://开头，或者不是网址！");
 		}
 		else{
 	alert("输入成功");
 	}
},
	
	
	
	//获取本地联系人列表
	getContactList: function(){
		var contactListStr = plus.storage.getItem("contactList");
		if(!this.isNotNull(contactListStr)){
			return [];
		}
		return JSON.parse(contactListStr);
	},
	
	
	//和后端的枚举对应
	CONNECT: 1,   //"第一次(或重连)初始化连接",
	CHAT: 2,		 //"聊天消息",
	SIGNED: 3,    //"消息签收",
	KEEPALIVE: 4, //"客户端保持心跳",
	PULL_FRIEND: 5,//从新拉取好友
	
	//和后端聊天模型保持一致
	ChatMSg: function(senderId,receiverId,msg,msgId){
		this.senderId = senderId;
		this.receiverId = receiverId;
		this.msg = msg;
		this.msgId = msgId;
	},
	
	
	//构建消息模型对象
	DataContent: function(action,chatMsg,extend){
		this.action = action;
		this.chatMsg = chatMsg;
		this.extend = extend;
	},
	
		//用于判断消息是否已读还是未读
	ChatSnapshot: function(myId, friendId, msg, isRead){
			this.myId = myId;
			this.friendId = friendId;
			this.msg = msg;
			this.isRead = isRead;
	},
	
	
	//保存聊天历史记录  flag 判断本条消息是我发送的 1:我 2:朋友
	saveUserChatHistory: function(myId,friendId,msg,flag){
		var me = this;
		var chatKey = "chat-"+ myId + "-"+ friendId;
		
		var chatHistoryListStr = plus.storage.getItem(chatKey);
		var chatHistoryList;
		if(me.isNotNull(chatHistoryListStr)){
			chatHistoryList = JSON.parse(chatHistoryListStr);
		}else{
			chatHistoryList = [];
		}
		
		//构建聊天记录对象
		var singleMsg = new me.ChatHistory(myId,friendId,msg,flag);
		chatHistoryList.push(singleMsg);
		
		plus.storage.setItem(chatKey,JSON.stringify(chatHistoryList));
	},
	
	//单个聊天记录的对象
	ChatHistory: function(myId,friendId,msg,flag){
		this.myId = myId;
		this.friendId = friendId;
		this.msg = msg;
		this.flag = flag;
	},
	
	//获取用户聊天记录
	getUserChatHistory:function(myId,friendId,msg){
		var me = this;
		var chatKey = "chat-"+ myId + "-"+ friendId;
		var chatHistoryListStr = plus.storage.getItem(chatKey);
		if(me.isNotNull(chatHistoryListStr)){
			chatHistoryList = JSON.parse(chatHistoryListStr);
		}else{
			chatHistoryList = [];
		}
		
		return chatHistoryList;
	},
	

	
		/**
	 * 根据用户id，从本地的缓存（联系人列表）中获取朋友的信息
	 * @param {Object} friendId
	 */
	getFriendFromContactList: function(friendId) {
		var contactListStr = plus.storage.getItem("contactList");
		
		// 判断contactListStr是否为空
		if (this.isNotNull(contactListStr)) {
			// 不为空，则把用户信息返回
			var contactList = JSON.parse(contactListStr);
			for (var i = 0 ; i < contactList.length ; i ++) {
				var friend = contactList[i];
				if (friend.friendUserId == friendId) {
					return friend;
					break;
				}
			}
		} else {
			// 如果为空，直接返回null
			return null;
		}
	},
		//聊天记录的快照 仅仅保存与朋友聊天的最后一条消息
	saveUserChatSnapshot: function(myId,friendId,msg,isRead){
		var me = this;
		var chatKey = "chat-snapshot"+ myId;
		
		// 从本地缓存获取聊天快照的list
		var chatSnapshotListStr = plus.storage.getItem(chatKey);

		var chatSnapshotList;
		if(chatSnapshotListStr != null && chatSnapshotListStr != "" && chatSnapshotListStr != undefined){
			// 如果不为空
			chatSnapshotList = JSON.parse(chatSnapshotListStr);
				// 循环这个list，判断是否存在好友，比对friendId，
			// 如果有，在list中的原有位置删除该 快照 对象，然后重新放入一个标记已读的快照对象
			for(var i = 0; i < chatSnapshotList.length; i++){
				if(chatSnapshotList[i].friendId == friendId){
					//删除已经存在的friendId对应的快照对象
					chatSnapshotList.splice(i,1);
					break;
				}
			}
		}else{
			chatSnapshotList = [];
		}
		
		//构建聊天快照对象
		var singleMsg = new me.ChatSnapshot(myId,friendId,msg,isRead);
	
		// 向list中追加快照对象
		chatSnapshotList.unshift(singleMsg);
		
		plus.storage.setItem(chatKey,JSON.stringify(chatSnapshotList));
		

},
	//获取用户快照记录列表
	getUserChatSnapshot: function(myId){
		var me = this;
		var chatKey = "chat-snapshot"+ myId;
		var chatSnapshotListStr = plus.storage.getItem(chatKey);
		var chatSnapshotList;
		if(me.isNotNull(chatSnapshotListStr)){
			chatSnapshotList = JSON.parse(chatSnapshotListStr);
		}else{
			chatSnapshotList = [];
		}
		
		return chatSnapshotList;
	},
	
	//标记未读消息为已读状态
	readUserChatSnapshot:function(myId,friendId){
		var me = this;
		var chatKey = "chat-snapshot"+ myId;
		var chatSnapshotListStr = plus.storage.getItem(chatKey);
		var chatSnapshotList;
		if(me.isNotNull(chatSnapshotListStr)){
			chatSnapshotList = JSON.parse(chatSnapshotListStr);
			// 循环这个list，判断是否存在好友，比对friendId，
			// 如果有，在list中的原有位置删除该 快照 对象，然后重新放入一个标记已读的快照对象
			for (var i = 0 ; i < chatSnapshotList.length ; i ++) {
				var item = chatSnapshotList[i];
				if (item.friendId == friendId) {
					item.isRead = true;		// 标记为已读
					chatSnapshotList.splice(i, 1, item);	// 替换原有的快照
					break;
				}
			}
			//替换原有的快照列表
			plus.storage.setItem(chatKey,JSON.stringify(chatSnapshotList));
		}else{
			return;
		}
		
		
	},
	
	//删除我和朋友的聊天记录
	deleteUserChatHistory: function(myId,friendId){
		var chatKey = "chat-"+ myId + "-"+ friendId;
		plus.storage.removeItem(chatKey);
	},
	
	deleteUserChatSnapshot:function(myId,friendId){
		var me = this;
		var chatKey = "chat-"+ myId + "-"+ friendId;
		var chatHistoryListStr = plus.storage.getItem(chatKey);
		if(me.isNotNull(chatHistoryListStr)){
			chatHistoryList = JSON.parse(chatHistoryListStr);
				// 循环这个list，判断是否存在好友，比对friendId，
			// 如果有，在list中的原有位置删除该 快照 对象，然后重新放入一个标记已读的快照对象
			for(var i = 0; i < chatSnapshotList.length; i++){
				if(chatSnapshotList[i].friendId == friendId){
					//删除已经存在的friendId对应的快照对象
					chatSnapshotList.splice(i,1);
					break;
				}
			}
		}else{
			return;
		}
		
			plus.storage.setItem(chatKey,JSON.stringify(chatSnapshotList));
	},


}