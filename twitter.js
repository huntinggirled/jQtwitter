'use strict';

(function(jQuery){
	var items = [];
	var settings;
	var page = 0;
	var timer = undefined;
	jQuery.fn.twitter = function(options) {
		var defaults = {
			screen_name: '[twitter screen name]',
			default_count: 1,
			page_count: 5,
			read_count: 50,
			interval: 1000,
			reload: 600000,
		};
		settings = jQuery.extend({}, defaults, options);
		if(settings.default_count>settings.page_count) settings.page_count = settings.default_count;
		if(settings.page_count>settings.read_count) settings.read_count = settings.page_count;
		var thisElem = jQuery(this);
		thisElem.after('<div id="more_tweet" />');
		thisElem.getTimeline();
	}

	jQuery.fn.getTimeline = function() {
		var eachfuncs = {
			printTweet: function(elem, item) {
				var utils = {
					stripSlashes: function(str) {
						return (str+'').replace(/\0/g, '0').replace(/\\([\\'"])/g, '$1');
					}
					,replaceLink: function(str) {
						var substr;
						var match = str.match(/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w-.\/?%&=~#]*)?/ig)
						if(match){
							for(var i = 0; i < match.length; ++i){
								substr = '<a href="' + match[i] + '" target="_blank">' + match[i] + '</a>';
								str = str.replace(match[i], substr);
							}
						}
						str = str.replace(/[#＃]([^\b\s]+)/gi, function(str, p1) {
							return '<a href="http://twitter.com/search?q=%23'+encodeURI(p1)+'" target="_blank">#'+p1+'</a>';
						});
						str = str.replace(/[@＠]([^\b\s]+)/gi, function(str, p1) {
							return '<a href="http://twitter.com/#!/'+encodeURI(p1)+'" target="_blank">@'+p1+'</a>';
						});
						return str;
					}
					,relativeTime: function(str) {
						return eachfuncs.relativeTime(utils.getDatetime(str));
					}
					,getDatetime: function(str) {
						var time_values = str.split(" ");
						var time_value = time_values[1]+" "+time_values[2]+", "+time_values[5]+" "+time_values[3];
						return Date.parse(time_value);
					}
				}
				if(item==undefined || item.user==undefined) return false;
				var id_str = item.id_str
				,utc_offset = item.utc_offset
				,screen_name = (item.user.screen_name!=undefined)?item.user.screen_name:'screen_name'
				,name = (item.user.name!=undefined)?item.user.name:'name'
				,profile_image = (item.user.profile_image_url!=undefined)?utils.stripSlashes(item.user.profile_image_url):"http://girled.net/js/twitter/noimg.png"
				,created_at = utils.relativeTime(item.created_at)
				,tweet_text = utils.replaceLink(item.text)
				,datetime = utils.getDatetime(item.created_at)
				;
				if(item.retweeted_status!=undefined) {
					screen_name = item.retweeted_status.user.screen_name
					,name = item.retweeted_status.user.name
					,profile_image = (item.retweeted_status.user.profile_image_url!=undefined)?utils.stripSlashes(item.retweeted_status.user.profile_image_url):"http://girled.net/js/twitter/noimg.png"
					,created_at = utils.relativeTime(item.retweeted_status.created_at)
					,tweet_text = utils.replaceLink(item.retweeted_status.text)
					,datetime = utils.getDatetime(item.retweeted_status.created_at)
					;
				}
				elem.append(
					'<div class="one_tweet" style="clear:both;">'
					+'<a href="http://twitter.com/#!/'+screen_name+'" target="_blank" title="@'+screen_name+'">'+name+'</a><br />'
					+'<a href="http://twitter.com/#!/'+screen_name+'" target="_blank" title="@'+screen_name+'"><img src="'+profile_image+'" alt="'+name+'" class="widget-img-thumb" width="32" height="32" /></a>'
					//+'<a href="http://twitter.com/#!/'+screen_name+'" target="_blank" title="@'+screen_name+'">'+name+'</a><br />'
					//+'@'+screen_name+'<br /> '
					+tweet_text
					+' '
					+'<a href="http://twitter.com/huntinggirled/status/'+id_str+'" target="_blank" class="ctime" data-datetime="'+datetime+'">'+created_at+'</a>'
					//+' '
					+'<br />'
					+'<div class="reply" style="text-align:right;opacity:0.2;">'
					+'<a href="http://twitter.com/intent/tweet?in_reply_to='+id_str+'" target="_blank">返信</a> '
					+'<a href="http://twitter.com/intent/retweet?tweet_id='+id_str+'" target="_blank">リツイート</a> '
					+'<a href="http://twitter.com/intent/favorite?tweet_id='+id_str+'" target="_blank">お気に入り</a>'
					+'</div>'
					+'</div>'
				);
				elem.children('.one_tweet:last').hover(
					function() {jQuery(this).children('.reply').fadeTo('normal', 1.0);}
					,function() {jQuery(this).children('.reply').fadeTo('normal', 0.2);}
				);
			}
			,relativeTime: function(str) {
				var parsed_date = str/1000;
				var relative_to = (new Date().getTime()/1000);
				var delta = parseInt(relative_to-parsed_date);
				delta = delta + (new Date().getTimezoneOffset()*60);
				if(delta<60) {
					return parseInt(delta).toString()+'秒前';
				} else if(delta<(60*60)) {
					return (parseInt(delta/60)).toString() + '分前';
				} else if(delta<(24*60*60)) {
					return (parseInt(delta/3600)).toString() + '時間前';
				} else {
					return (parseInt(delta/86400)).toString() + '日前';
				}
			}
			,elapsedTime: function(elem) {
				return elem.find('.ctime').each(function() {
					var ptime = jQuery(this).html();
					var etime = eachfuncs.relativeTime(jQuery(this).data('datetime'));
					if(ptime!=etime) jQuery(this).css('opacity', 0.0).html(etime).fadeTo('normal', 1.0);
				});
			}
			,shiftItems: function(elem) {
				elem.append('<div class="tweet" style="opacity:0.0;" />');
				var tweetElem = elem.children('.tweet:last');
				tweetElem.fadeTo('normal', 1.0);
				for(var i=0; i<settings.page_count; i++) {
					eachfuncs.printTweet(tweetElem, items.shift());
					if(items.length<=0) break;
				}
				eachfuncs.elapsedTime(thisElem);
				jQuery('#more_tweet').empty().append('<div style="text-align:right;"><a href="" onmouseover="jQuery(\'#twitter\').getTimeline();return false;">[さらに読み込む]</a></div>');
			}
			,eachThis: function(elem) {
				var thisElem = elem;
				jQuery('#more_tweet').empty().append('<div style="text-align:right;"><img src="http://girled.net/indi.gif" alt="読み込み中..." width="10px" height="10px" /> 読み込み中...</div>');
				if(page>=1 && items.length>=settings.page_count) eachfuncs.shiftItems(thisElem);
				else {
					var params = {
						screen_name: settings.screen_name,
						count: (page==0)?settings.default_count:settings.read_count,
						page: (page==0)?++page:page++,
						include_rts: true,
					}
					jQuery.ajax({
						url: 'http://api.twitter.com/1/statuses/user_timeline.json',
						data: params,
						dataType: 'jsonp',
						callback: 'twitterCallback',
						timeout: 5000,
						success: function(data, status) {
							if((page-1)==0 || (page-1)==1) items = [];
							items = items.concat(data);
							if((page-1)==1) items.splice(0, settings.default_count);
							if((page-1)==0) thisElem.empty();
							eachfuncs.shiftItems(thisElem);
						},
						error: function(XMLHttpRequest, status, errorThrown) {
							eachfuncs.elapsedTime(thisElem);
							jQuery('#more_tweet').empty();
						}
					});
				}
			}
		}
		var thisElem = jQuery(this);
		eachfuncs.eachThis(thisElem);
		var dTime = new Date().getTime();
		if(timer!=undefined) clearInterval(timer);
		timer = setInterval(function() {
			if(dTime+settings.reload < (new Date().getTime())) {
				page = 0;
				eachfuncs.eachThis(thisElem);
				dTime = new Date().getTime();
			}
		}, settings.interval);
		return thisElem;
	}
})(jQuery);
