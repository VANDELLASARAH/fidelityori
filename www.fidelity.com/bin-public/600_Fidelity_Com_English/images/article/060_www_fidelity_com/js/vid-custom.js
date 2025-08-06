metaLoad = {
    vidSmil: function (smilURL, vidContainer, feedFlag) {

        // vid section
        var vidSection = vidContainer.querySelector('section');

        // current video
        var currentVid = metaLoad.getCurrentVid(vidSection);

        var smilReq = new XMLHttpRequest();
        smilReq.open("GET.html", smilURL, true);
        smilReq.send();

        smilReq.onreadystatechange = function () {
            if (smilReq.readyState === 4) {
                if (smilReq.status === 200) {
                    var parseXML = metaLoad.stringToXML(smilReq.responseText);
                    var vidItems = parseXML.entries;

                    // playlist resize event
                    metaLoad.playlistResize();
                    window.addEventListener("resize", metaLoad.playlistResize);
                    if(feedFlag && typeof vidItems != "undefined") {
                        for(var i = 0; i < vidItems.length; i++) {
                            // url to vid asset
                            var vidURL = metaLoad.getVidURL(vidItems[i]);

                            // poster 
                            var vidPoster = metaLoad.getPoster(vidItems[i]);

                            var loadThisVideo = false;
                            if (!metaLoad.dlPid && i===0) { loadThisVideo = true; }

                            if(loadThisVideo) {
                                // set title
                                metaLoad.setTitle(vidItems[i].title, vidContainer);
                                
                                // set description
                                metaLoad.setDescription(vidItems[i].description, vidContainer);   
                                                            
                                // map from items
                                metaLoad.getItemResources(vidPoster, currentVid);

                                //map from item embeds
                                    metaLoad.getVidResources(vidURL, currentVid, i);
                            }

                            // map playlist
                            metaLoad.mapPlaylist(vidItems, vidSection, i);
                        }
                        // if a pid has been provided in the querystring, load that video
                        if (metaLoad.dlPid) { metaLoad.deepLinkToPlaylistVideo(vidSection); }

                    } else {
                        var parseXML = metaLoad.stringToXML(smilReq.responseText);

                        // set title
                        metaLoad.setTitle(parseXML.title, vidContainer);  

                        // set description
                        metaLoad.setDescription(parseXML.description, vidContainer); 
                        
                        // map from items
                        metaLoad.getItemResources(parseXML.defaultThumbnailUrl, currentVid);

                        //map from item embeds
                        metaLoad.getVidResources(metaLoad.linkBaseURL + parseXML.pid, currentVid, i);
                    }
                    // check for 3 column in-line videos
                    metaLoad.checkThreeColumns();

                    // pause other media on play
                    metaLoad.pauseOtherMedia();

                    // enable cc keyboard accessibility
                    metaLoad.ccButtonKeys(currentVid);
                }
            }
        }
    },
    checkThreeColumns: function() {
        if(document.querySelector(metaLoad.vidThreeCol + ' ' + metaLoad.vidContainer) != null) {
            var vidCol = document.querySelectorAll(metaLoad.vidThreeCol + ' ' + metaLoad.vidContainer);
            for(var s=0; s < vidCol.length; s++) {
                vidCol[s].closest(metaLoad.vidThreeCol).classList.add(metaLoad.vidTwoCol);
                var vidColCont = vidCol[s].closest(metaLoad.vidThreeColCont);
                vidColCont.classList.add(metaLoad.vidThreeColContClass);
                var vCol = vidColCont.querySelector('div').children;
                for(var z=0; z < vCol.length; z++) {
                    vCol[z].classList.add(metaLoad.vidThreeColItemClass);
                }
            }
        }
    },
    getParameterByName: function(name) {
        var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    },
    matchExact: function(stringToMatch, stringToTest) {
        var regex = new RegExp(stringToMatch, "gi");
        return stringToTest.match(regex);
    },
    matchBetween: function(leftBoundary, rightBoundary, stringToTest) {
        var regex = new RegExp(leftBoundary + "(.*?)" + rightBoundary);
        var match = decodeURIComponent(stringToTest.match(regex)[1]);
        return match;
    },
    setPlaylistPosition: function(currentVid, vidItemIndex) {
        videojs(currentVid.id).setAttribute('data-playlistposition', vidItemIndex);
    },
    setPlaylistInactive: function(playlist) {
        var plItems = playlist.querySelectorAll(metaLoad.playlistCln);
        for(var pl=0; pl < plItems.length; pl++) {
            plItems[pl].classList.remove('active');
        }
    },
    playlistResize: function() {
        var playlists = document.querySelectorAll(metaLoad.playlist);
        var bodyStyles = window.getComputedStyle(document.querySelector('body'));
        for(var p = 0; p < playlists.length; p++) {
            if(playlists[p].parentNode.offsetWidth / parseFloat(bodyStyles.fontSize) < 60) {
                playlists[p].classList.remove('col-3');
                playlists[p].classList.add('col-9','playlist--collapse');
            } else {
                playlists[p].classList.remove('col-9','playlist--collapse');
                playlists[p].classList.add('col-3');                 
            }
        };
    },
    setTitle: function(vidTitle, vidContainer) {
        vidContainer.querySelector(metaLoad.vidTitle).innerHTML = vidTitle;
    },
    setDescription: function(vidDescription, vidContainer) {
        vidContainer.querySelector(metaLoad.vidDescription).innerHTML = vidDescription;
    },     
    getCurrentVid: function(vidContainer) {
        if(vidContainer != null) {
            if(vidContainer.querySelector('video') != null) {
                return vidContainer.querySelector('video');
            }
            if(vidContainer.querySelector('audio') != null) {
                return vidContainer.querySelector('audio');
            }
        }
    },
    getVidURL: function(vidItem) {
        if(vidItem != null) {
            for(var mc = 0; mc < vidItem.media$content.length; mc++) {
                var v = vidItem.media$content[mc].plfile$url;
            }
        }
        return v;
    },
    getPoster: function(vidItem) {
        var vidPoster;
        if(vidItem != null) {
            for(var vp = 0; vp < vidItem.media$thumbnails.length; vp++) {
             if(vidItem.media$thumbnails[vp].plfile$isDefault == false) {
                 vidPoster = vidItem.media$thumbnails[vp].plfile$url;
             }
            }
           }
        return vidPoster;
    },
    getThumbnail: function(vidItem) {
        var vidThumbnail;
        if(vidItem != null) {
            for(var vp = 0; vp < vidItem.media$thumbnails.length; vp++) {
             vidThumbnail = vidItem.media$thumbnails[vp].plfile$url;
            }
           }
        return vidThumbnail;
    },
    getChapters: function (vidItem) {
        var chapterList;
        if(vidItem != null) {
            chapterList = vidItem.querySelectorAll('plmedia\\:chapter');
        }
        return chapterList;
    },
    getItemResources: function(vidPoster, currentVid, event) {
        if (vidPoster != undefined) {
            if(videojs.getAllPlayers().length > 0) {
                // map poster
                videojs(currentVid).poster(vidPoster);
            } else {
                currentVid.setAttribute('poster', vidPoster);
            }
        }
    },
    getVidResources: function (url, currentVid, vidItemIndex) {
        var vidReq = new XMLHttpRequest();
        vidReq.open("GET.html", url, true);
        vidReq.send();
        vidReq.onreadystatechange = function () {
            if (vidReq.readyState === 4) {
                if (vidReq.status === 200) {
                    // map vid item
                    metaLoad.mapVidResources(currentVid, metaLoad.stringToHTML(vidReq.responseText), vidItemIndex);
                }
            }
        }
    },
    getTranscript: function(url, callback) {
        var vidReq = new XMLHttpRequest();
        vidReq.open("GET.html", url, true);
        vidReq.onreadystatechange = function () {
            if (vidReq.readyState === 4) {
                if (vidReq.status === 200) {
                    if(typeof callback==='function') {
                        callback(vidReq.responseText);                      
                    }
                }
            }
        }
       vidReq.send();
    },
    processTranscript: function(transcript, currentVid) {
        var parser = new DOMParser();
        var dom = parser.parseFromString(transcript, "application/xml");
        var txtNodes = dom.querySelectorAll("p");
        videojs(currentVid).addRemoteTextTrack({
            kind: 'captions',
            label: 'captions'
        });
        var tracks = videojs(currentVid).textTracks();

        for (var v = 0; v < tracks.length; v++) {
          var track = tracks[v];

          if (track.kind === 'captions') {
                track.mode = 'hidden';
                for(var t = 0; t < txtNodes.length; t++) {
                    var bc = metaLoad.transcriptConvertCue(txtNodes[t].getAttribute("begin"));
                    var ec = metaLoad.transcriptConvertCue(txtNodes[t].getAttribute("end"));
                    var rb = metaLoad.transcriptReplaceBreaks(txtNodes[t].innerHTML);
                    track.addCue(new VTTCue(bc, ec, rb));
                }
            }
        }
    },
    processDisclaimer: function(disclaimerText, currentVid) {
        if(disclaimerText != null) {
            videojs(currentVid).el().closest(metaLoad.vidContainer).querySelector(metaLoad.vidDisclaimer).querySelector('.pvd-expand-collapse__content').innerHTML = disclaimerText;
            videojs(currentVid).el().closest(metaLoad.vidContainer).querySelector(metaLoad.vidDisclaimer).classList.add('vid--disclaimer--show');
        } else {
            videojs(currentVid).el().closest(metaLoad.vidContainer).querySelector(metaLoad.vidDisclaimer).classList.remove('vid--disclaimer--show');
            videojs(currentVid).el().closest(metaLoad.vidContainer).querySelector(metaLoad.vidDisclaimer).querySelector('pvd-expand-collapse').setAttribute('pvd-expand', false);
        }
    },
    processLegalText: function(legalCopyright, legalText, currentVid) {		
		 if (legalCopyright == null || legalCopyright == '' ) {
            if (legalText != null && legalText != '') {
                videojs(currentVid).el().closest(metaLoad.vidContainer).querySelector(metaLoad.vidLegal).innerText = legalText;
                videojs(currentVid).el().closest(metaLoad.vidContainer).querySelector(metaLoad.vidLegal).classList.add('vid--legal--show');
            }
            else {
                videojs(currentVid).el().closest(metaLoad.vidContainer).querySelector(metaLoad.vidLegal).classList.remove('vid--legal--show');
            }
        } else {
            if (legalText != null && legalText != '') {
                videojs(currentVid).el().closest(metaLoad.vidContainer).querySelector(metaLoad.vidLegal).innerText = "© " + legalCopyright + ' ' + legalText;
            }
            else {
                videojs(currentVid).el().closest(metaLoad.vidContainer).querySelector(metaLoad.vidLegal).innerText = "© " + legalCopyright;
            }
            videojs(currentVid).el().closest(metaLoad.vidContainer).querySelector(metaLoad.vidLegal).classList.add('vid--legal--show');
        }
    },
    transcriptConvertCue: function(time) {
        tt=time.split(":");
        sec=tt[0]*3600+tt[1]*60+tt[2]*1;
        return sec;
    },
    transcriptReplaceBreaks: function(str) {
        var r = str.replace('<br xmlns="http://www.w3.org/ns/ttml"/>','\n');
        return r;
    },
    removeTrack: function(currentVid, trackType) {
        // Remove all tracks by type:
        var tracks = videojs(currentVid).textTracks();
        for (var i = 0, I=tracks.length; i<I;i++) {
            if(tracks[i].kind == trackType || trackType === "all") {
                videojs(currentVid).removeRemoteTextTrack(tracks[i]);
            }
        }
    },
    removeAllTracks: function(currentVid) {
        // Remove all tracks:
        metaLoad.removeTrack(currentVid,'all');
    },
    getItemElemType: function(vidItem) {
        if(vidItem.querySelector('audio') != null) {
            return 'audio';
        }
        if(vidItem.querySelector('video') != null) {
            return 'video';
        }        
    },
    mapVidResources: function (currentVid, vidItem) {
        // map/load audio or video
        // reset & map src
        if(metaLoad.getItemElemType(vidItem) == 'audio') {        
            videojs(currentVid).src({
                type: 'audio/mpeg',
                src: vidItem.querySelector('audio').getAttribute('src')
            });
        }
        if(metaLoad.getItemElemType(vidItem) == 'video') { 
            videojs(currentVid).src({
                type: 'video/mp4',
                src: vidItem.querySelector('video').getAttribute('src')
            });
        }

        //map static video transcript
        if(vidItem.querySelector(metaLoad.getItemElemType(vidItem) + ' [name*="Video_Transcript"]') != null) {
            var videoStaticTrans = vidItem.querySelector(metaLoad.getItemElemType(vidItem) + ' [name*="Video_Transcript"]').getAttribute('value');
            if(!$(metaLoad.vidDescription).html().includes(videoStaticTrans)) {
                let vidDesc = '<a href="' + videoStaticTrans + '" target="_blank" class="vid-link--transcript">View full transcript (PDF)</a>';
                $(metaLoad.vidDescription).html(vidDesc);
            }
        } 

        // map static legal text
        if(vidItem.querySelector(metaLoad.getItemElemType(vidItem)).getAttribute('copyright') != null) {
            var legalCopyright = vidItem.querySelector(metaLoad.getItemElemType(vidItem)).getAttribute('copyright');
        } else {
            var legalCopyright = '';
        }
        if(vidItem.querySelector(metaLoad.getItemElemType(vidItem) + ' [name*="Static_legal_text"]') != null) {
            var legalText = vidItem.querySelector(metaLoad.getItemElemType(vidItem) + ' [name*="Static_legal_text"]').getAttribute('value');
            metaLoad.processLegalText(legalCopyright, legalText, currentVid);
        } else {
            metaLoad.processLegalText(legalCopyright, null, currentVid);
        }
                
        // map disclaimer
        if(vidItem.querySelector(metaLoad.getItemElemType(vidItem) +' [name*="Disclaimer_text"]') != null) {
            var disclaimerText = vidItem.querySelector(metaLoad.getItemElemType(vidItem) +' [name*="Disclaimer_text"]').getAttribute('value');
            metaLoad.processDisclaimer(disclaimerText, currentVid);
        } else {
            metaLoad.processDisclaimer(null, currentVid);
        }

        // map subtitles track
        if(vidItem.querySelector('par textstream[src*="dfxp"]') != null) {
            metaLoad.getTranscript(vidItem.querySelector('par textstream').getAttribute('src'), function (responseText) {
                metaLoad.processTranscript(responseText, currentVid);
            });

        } else if(vidItem.querySelector('par textstream[src*="vtt"]') != null) {
            videojs(currentVid).addRemoteTextTrack({
                kind: 'captions',
                label: 'captions',
                src: vidItem.querySelector('par textstream[closedCaptions="true"]').getAttribute('src')
            });
          } else {
            // Remove tracks:
            var tracks = videojs(currentVid).textTracks();
            if(tracks.length > 0) {
                for (i = 0; i<tracks.length;i++) {
                    videojs(currentVid).removeRemoteTextTrack(tracks[i]);
                }
            } else {
                // remove track if empty
                metaLoad.removeTrack(currentVid, 'subtitles');
            }
          }
        // map chapter track
        if(vidItem.querySelector('par textstream[src*="chapters"]') != null) {
            videojs(currentVid).addRemoteTextTrack({
                kind: 'chapters',
                label: 'chapters',
                src: vidItem.querySelector('par textstream[src*="chapters"]').getAttribute('src')
            });

          } else {
            // remove track if empty
            metaLoad.removeTrack(currentVid, 'chapters');
          }

          // autoplay
          if(videojs(currentVid).el().closest(metaLoad.vidContainer).getAttribute('data-autoplay') == "true") {
              if(videojs(currentVid).getAttribute('data-playlistposition') == null) {
                  metaLoad.setPlaylistPosition(currentVid, 0);
              }
              videojs(currentVid).one("ended", function(){
                   var pp = parseInt(this.getAttribute('data-playlistposition'));
                   pp++;
                   if(videojs(currentVid).el().closest(metaLoad.vidContainer).querySelectorAll('.playlist [data-playlistposition]')[pp] != null) {
                    videojs(currentVid).el().closest(metaLoad.vidContainer).querySelectorAll('.playlist [data-playlistposition]')[pp].click();
                    videojs(currentVid).play();
                   }
              });
          }
        videojs(currentVid).ready(function() {
            videojs(currentVid).el().closest(metaLoad.vidContainer).style.display = "block";     
        });
    },
    mapPlaylist: function(vidItems, vidContainer, vidItemIndex) {
        // if there are more than 1 item in the feed, make a playlist
        if(vidItems.length > 1) {
            var playlist = vidContainer.querySelector(metaLoad.playlist);

            // make a copy
            var playlistCln = playlist.querySelector(metaLoad.playlistCln).cloneNode(true);
            
            // get poster from current item
            var poster = metaLoad.getPoster(vidItems[vidItemIndex]);

            // get title from current item
            if(vidItems[vidItemIndex].title) {
                var title = vidItems[vidItemIndex].title;
            } else {
                var title = '';
            }
            
            // get duration from current item
            if(vidItems[vidItemIndex].media$content[0].plfile$duration) {
                var duration = metaLoad.formatTime(vidItems[vidItemIndex].media$content[0].plfile$duration);
            } else {
                var duration = '';
            }

            // show playlist container
            vidContainer.querySelector('.helios-block').classList.remove('col-12');
            vidContainer.querySelector('.helios-block').classList.add('col-9');

            // populate poster
            // disable poster, per UX
            // playlistCln.querySelector('img').setAttribute('src', poster);

            // populate vidHeading
            playlistCln.querySelector('.playlist--vidHeading').innerHTML = title + '<p class="playlist--time"></p>';

            //populate vidtime
            playlistCln.querySelector('.playlist--time').innerText = duration;

            //set playlist position attribute
            playlistCln.setAttribute('data-playlistposition', vidItemIndex);

            //set PID attribute
            playlistCln.setAttribute('data-link', metaLoad.matchBetween("qlVTIC/index.html", "\\?feed",metaLoad.getVidURL(vidItems[vidItemIndex])));

            //highlight active
            if(vidItemIndex == 0) {
                playlistCln.classList.add('active');
            }

            // click event
            playlistCln.addEventListener('click', function(event){
                metaLoad.setPlaylistInactive(this.parentNode);
                this.classList.add('active');

                // url to vid asset
                var vidURL = metaLoad.getVidURL(vidItems[vidItemIndex]);
                var vidPoster = metaLoad.getPoster(vidItems[vidItemIndex]);
                var currentVid = metaLoad.getCurrentVid(vidContainer);

                $(currentVid).removeClass('vid--captions'); 
                metaLoad.removeAllTracks(currentVid);

                // reset player
                metaLoad.setPlaylistPosition(currentVid, vidItemIndex);
                metaLoad.setTitle(vidItems[vidItemIndex].title, vidContainer.closest(metaLoad.vidContainer));
                metaLoad.setDescription(vidItems[vidItemIndex].description, vidContainer.closest(metaLoad.vidContainer));
                metaLoad.getItemResources(vidPoster, currentVid, event);
                metaLoad.getVidResources(vidURL, currentVid, vidItemIndex);
            }, false);

            // add to playlist
            playlist.appendChild(playlistCln);
            
            // display the playlist
            playlist.classList.add('playlist--show');
        }
    },
    deepLinkToPlaylistVideo: function(vidContainer) {
        //activate on pid request
        if(metaLoad.dlPid != null) {
        var playlist = vidContainer.querySelector(metaLoad.playlist);
        var playlistCln = playlist.querySelectorAll(metaLoad.playlistCln);
        var currentVid = metaLoad.getCurrentVid(vidContainer);
        
            for(var p = 0, P=playlistCln.length; p < P; p++) {
                if(playlistCln[p].dataset.link == metaLoad.dlPid) {
                    metaLoad.removeAllTracks(currentVid);
                    playlistCln[p].click();
                    break;
                }                                   
            }
        }
    },
    pauseOtherMedia: function() {
        var medias = document.querySelectorAll('audio,video');
        for(var m = 0; m < medias.length; m++) {
            medias[m].addEventListener('play', function(event) {
                for(var n = 0; n < medias.length; n++) {
                    if(event.target != medias[n]) medias[n].pause();
                }
            });
        }
    },
    linkHandle: function(evt) {
        evt.currentTarget.currentVid.currentTime = evt.currentTarget.chapterTime;
        evt.currentTarget.currentVid.play();
    },
    stringToXML: function (str) {
        var doc = JSON.parse(str);
        return doc;
    },
    stringToHTML: function (str) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(str, 'text/html');
        return doc;
    },
    formatTime: function (timeStr) {
        return new Date(timeStr * 1000).toISOString().substr(11, 8).replace(/^0(?:0:0?)?/, '');
    },
    getCurrentYear: function() {
        return new Date().getFullYear();
    },
    ccButtonKeys: function(currentVid) {
        var ccMenuContainer = videojs(currentVid).el().closest(metaLoad.vidContainer).querySelector(metaLoad.ccMenuContainer);

        // remove aria tags
        if(ccMenuContainer.querySelector(metaLoad.ccButton) != null) {
            ccMenuContainer.querySelector(metaLoad.ccButton).removeAttribute('aria-disabled');                    
            ccMenuContainer.querySelector(metaLoad.ccButton).removeAttribute('aria-haspopup');
        }
        ccMenuContainer.addEventListener('click', function(e) {
            metaLoad.ccMenuShow(e);
            currentVid.classList.toggle('vid--captions');
        })
    },
    ccMenuShow: function(e) {
        var ccTarget = e.currentTarget;
        var ccTargetButton = ccTarget.querySelector(metaLoad.ccButton);
        var ccFocus = ccTarget.querySelector(metaLoad.ccMenu);
         if(ccFocus != null) {
            var ccSelectMenuOption = ccFocus.querySelector(metaLoad.ccMenuSelect);
            if (ccSelectMenuOption != null) {
                ccSelectMenuOption.click();
                if(ccSelectMenuOption.querySelector(metaLoad.ccStatus).textContent == 'captions') {
                    ccTargetButton.setAttribute('aria-pressed', 'true');
                    ccTargetButton.setAttribute('aria-expanded', 'true');
                } else {
                    ccTargetButton.setAttribute('aria-pressed', 'false');
                    ccTargetButton.setAttribute('aria-expanded', 'false');
                }
            }
        }
    }
}

metaLoad.dlPid = metaLoad.getParameterByName('pid');
metaLoad.vidContainer = '.vid';
metaLoad.vidContainerCollection = document.querySelectorAll(metaLoad.vidContainer);
metaLoad.vidTitle = '.vid--title';
metaLoad.vidDescription = '.vid--description';
metaLoad.vidDisclaimer = '.vid--disclaimer';
metaLoad.vidLegal = '.vid--legal';
metaLoad.chapterContainer = document.querySelector('.chapterList');
metaLoad.feedBaseURL = "https://feed.theplatform.com/f/qlVTIC/";
metaLoad.linkBaseURL = "https://link.theplatform.com/s/qlVTIC/";
metaLoad.playlist = '.playlist';
metaLoad.playlistCln = '.playlist--item';
metaLoad.vidTwoCol = 'scl-flexible-images-with-column-2';
metaLoad.vidThreeCol = '.scl-flexible-images-with-column-3';
metaLoad.vidThreeColCont = '.popin-wrapper--body';
metaLoad.vidThreeColContClass = 'vid--3-col';
metaLoad.vidThreeColItemClass = 'vid--3-col-item';
metaLoad.ccMenuContainer = '.vjs-captions-button.vjs-menu-button';
metaLoad.ccButton = '.vjs-captions-button';
metaLoad.ccMenu = '.vjs-menu-content';
metaLoad.ccMenuSelect = '.vjs-menu-item:not(.vjs-menu-item.vjs-texttrack-settings):not(.vjs-selected)';
metaLoad.ccStatus = '.vjs-menu-item-text';
            
metaLoad.feedFlag;

for(var v=0; v < metaLoad.vidContainerCollection.length; v++) {
    if(!!metaLoad.vidContainerCollection[v].getAttribute('data-feed')) {
        metaLoad.feedFlag = true;
        metaLoad.vidSmil(metaLoad.feedBaseURL + metaLoad.vidContainerCollection[v].dataset.feed + '/?form=json', metaLoad.vidContainerCollection[v], metaLoad.feedFlag);
    } else {
        if(!!metaLoad.vidContainerCollection[v].getAttribute('data-link')) {
            metaLoad.feedFlag = false;
            metaLoad.vidSmil(metaLoad.linkBaseURL + metaLoad.vidContainerCollection[v].dataset.link + '?&width=500&height=500&format=preview&format=preview', metaLoad.vidContainerCollection[v], metaLoad.feedFlag);
        }
    }
}