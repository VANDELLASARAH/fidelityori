// TODO: Move shared initialization code into its own section
// TODO: Put specific player initialization code into separate functions
// TODO: Parse the JSON more idiomatically
// TODO: Let the user pass in a div/player ID to use for the player -- this would allow multiple players on the same page

// TODO: Add a description to each function and variable

var video = (function () {

    var global_autoplay_On = false;
    var global_Share_Embed_Code = false;
    var disclaimerDisplayed = true;

    // This will be set to false if the initialization function receives 3 parameters.
    // This is for backwards compatibility with the previous Tridion CTs.
    var article_parameters = true;

    var config = {
        cusId: "c3.TP-Fidelity",
        cdn: "AKAMAI",
        pdk_prefix: typeof WWW_HOST === "undefined" || WWW_HOST === ""?"/webcontent/videoContent/latest":WWW_HOST+"/webcontent/videoContent/latest"
    }
    var firsttime = true;
    var releasePid = null;

    var Share_Embed_Code_Found = false;
    var Hubautoplay_On_Found = false;
    var hubDisclaimerDisplayed = false;
    var parameters = true;

    var original_Static_legal_text;

    // TODO: remove publicid, no longer used.
    var publicid;

    // TODO: Don't use window for these vars
    window.firstClick = true;
    window.videoFeedURL = null;
    var popInPage = false;
    var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);

    function feedcheck(feedUrl) {
        if (document.location.href.indexOf("?") > 0 && document.location.href.indexOf("=") > 0) {
            var params = document.location.href.split("?")[1].split("&");
            for (var i = 0; i < params.length; i++) {
                if (params[i].toLowerCase().indexOf("feedUrl=") == 0) {
                    feedUrl = params[i].split("=")[1];
                }
            }
        }
        return feedUrl;
    }

    function getUrlParameter(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }
    }

    function lazyLoadPlayer(pwidth, pheight) {
//    console.log("load player");
        playerInit(pwidth, pheight);
        $.getScript(config.pdk_prefix+'/../55/pdk/qos/1.3/tpLegacyQos.js').done(function (script, status) {

        }).fail(function (jqxhr, settings, exception) {

        });
    }

    var PopIn = {};

    PopIn.getPopInCheckString = function () {
        var classes = ['.medium-videohub', '.large-videohub', '.videomedium', '.videolarge', '.videosmall', '.videoxsmall', '.videohub'];
        var str = '';

        var prepend = '.popin--container';
        for (var i = 0; i < classes.length; i++) {
            str += prepend + ' ' + classes[i] + ',';
        }

        str = str.substring(0, str.length - 1);
        return str;
    };

    // This is to get the Tridion tcm id of the popin component
    PopIn.getPopInTcmString = function () {
        var classes = ['.medium-videohub', '.large-videohub', '.videomedium', '.videolarge', '.videosmall', '.videoxsmall', '.videohub'];
        var str = '';
        var prepend = '[data-fmrTocTcmId]:has(';
        for (var i = 0; i < classes.length; i++) {
            str += prepend + ' ' + classes[i] + '),';
        }

        str = str.substring(0, str.length - 1);
        return str;
    };

    // Detect if we are on a popin page
    PopIn.onPopInPage = function () {
        if ($(PopIn.getPopInCheckString()).length != 0) {
            return true;
        } else {
            return false;
        }
    };

    PopIn.setupPopIn = function (pwidth, pheight) {
        popInPage = true;
        // get the tcm that identifies this video
        var tcm = $(PopIn.getPopInTcmString()).attr('data-fmrtoctcmid');
        // get the link responsible for this popin
        var link = $('[onclick*="' + tcm + '"]');
        var close = $('[popintcmid="' + tcm + '"] .popin--close-button');

        $(link).click(function (e) {
            var tcm = $(PopIn.getPopInTcmString()).attr('data-fmrtoctcmid');
            // get the link responsible for this popin
            var link = $('[onclick*="' + tcm + '"]');
            var close = $('[popintcmid="' + tcm + '"] .popin--close-button');
            //console.log(window.firstClick);
            var el = $(close)[0],
                elClone = el.cloneNode(true);
            el.parentNode.replaceChild(elClone, el);
            close = $(elClone);

            if (window.firstClick) {
                lazyLoadPlayer(pwidth, pheight);
                $(close).click(function (e) {
                    $pdk.controller.pause(true);
                    $(close).closest('.popin').css('visibility', 'hidden');
                    $(close).closest('.popin').find('*').css('visibility', 'hidden');

                });
                window.firstClick = false;
            } else {
                $(close).closest('.popin').css('visibility', 'visible');
                $(close).closest('.popin').find('*').css('visibility', 'visible');

                $(close).click(function (e) {

                    $pdk.controller.pause(true);
                    $(close).closest('.popin').css('visibility', 'hidden');
                    $(close).closest('.popin').find('*').css('visibility', 'hidden');

                });
                // Workaround for reloading the release list in the flash player

                setTimeout(function () {
                    tpController.loadReleaseURL("https://link.theplatform.com/s/qlVTIC/" + releasePid, true);
                }, 4000);

            }
        });
    };

    var popInCheckString = '[data-fmrTocTcmId] .medium-videohub,[data-fmrTocTcmId] .large-videohub';
    var popInTCMString = '[data-fmrTocTcmId]:has(.medium-videohub), [data-fmrTocTcmId]:has(.large-videohub)';

    function initHubPlayer_old(feedUrl, pwidth, pheight) {
//    console.log('Running initHubPlayer');
        // Load the tpLegacyQoS javascript file
        window.videoFeedURL = feedUrl;
        $(document).ready(function () {
            Switch_Options_Check(feedUrl);
            var url = feedUrl;
            publicid = url.substring(url.lastIndexOf('/') + 1);
            // detect if on Pop-in page
            // if so, delay player init until
            if (PopIn.onPopInPage()) {
                PopIn.setupPopIn(pwidth, pheight);
            } else {
                lazyLoadPlayer(pwidth, pheight);
            }
        });
        addIdForHub(feedUrl);
    }

    function initHubPlayer(feedUrl, pwidth, pheight, share, autoplay, autoplay_hub_videos, disclaimer_expanded) {
        // The previous version had only three arguments
        // This is for backwards compatibility
        if (arguments.length != 3) {
            global_autoplay_On = (autoplay != null) ? autoplay : false;
            global_Share_Embed_Code = (share != null) ? share : false;
            Share_Embed_Code_Found = (share != null) ? share : false;
            hubDisclaimerDisplayed = (disclaimer_expanded != null) ? disclaimer_expanded : false;
            Hubautoplay_On_Found = (autoplay_hub_videos != null) ? autoplay_hub_videos : true;
        } else {
            parameters = false;
        }

        initHubPlayer_old(feedUrl, pwidth, pheight);
        addIdForHub(feedUrl);

        if(isChrome)
            $('.responsive-horizontal-hub .player-info #embedDiv').css('height','19px');

        /* else
         {
         $('.responsive-horizontal-hub .player-info #embedDiv').css('padding-bottom','56.25%');
         } */
    }

    function Switch_Options_Check(feedUrl) {
        // TODO: Read in JSON object directly instead of doing string parsing
        try {
            feedUrl = feedcheck(feedUrl);
            var txtFile = new XMLHttpRequest();
            txtFile.open("GET", feedUrl, false);
            txtFile.onreadystatechange = function () {
                if (txtFile.readyState === 4) {  // Makes sure the document is ready to parse.
                    if (txtFile.status === 200) {  // Makes sure it's found the file.
                        allText = txtFile.responseText;
                        var rawPids = allText.split('url="');
                        var pids = new Array();
                        try {
                            var URL = rawPids[1].split("feed")[0] + 'format=preview';
                            var txtFile1 = new XMLHttpRequest();
                            txtFile1.open("GET", URL, false);
                            txtFile1.onreadystatechange = function () {
                                if (txtFile1.readyState === 4) {
                                    if (txtFile1.status === 200) {
                                        allText1 = txtFile1.responseText;
                                        var only_hub = allText1.toUpperCase();
                                        var Hubautoplay1 = only_hub.split('"pl2$Hubautoplay_On": '.toUpperCase());
                                        var Hubautoplay2 = Hubautoplay1[1].substr(0, 4);

                                        if (Hubautoplay2 == 'TRUE' && parameters == false) {
                                            Hubautoplay_On_Found = true;
                                        } else {

                                        }
                                        var Share_Embed1 = only_hub.split('"pl2$Share_Embed_Code": '.toUpperCase());
                                        var Share_Embed2 = Share_Embed1[1].substr(0, 4);

                                        if (Share_Embed2 == 'TRUE' && parameters == false) {
                                            Share_Embed_Code_Found = true;
                                        } else {

                                        }

                                    }
                                }
                            }
                            txtFile1.send(null);
                        }
                        catch (err) {
                            //console.log(err);
                        }
                    }
                }
            }
            txtFile.send(null);
        }
        catch (err) {
            //console.log(err);
        }
    }

    /* var currentPlaylist=undefined;

     $pdk.controller.addEventListener("OnReleaseStart", function(e) {
     currentPlaylist = e;
     console.log("event listener: "+currentPlaylist);
     });

     function hubAnalyticsMeasurement(){
     if(currentPlaylist){
     s["eVar24"]=currentPlaylist.data.releasePID;
     s["prop24"]=currentPlaylist.data.releasePID;
     console.log("hubAnalyticsMeasurement "+currentPlaylist.data.releasePID);
     }
     }*/

    function playerInit(pwidth, pheight) {

        original_Static_legal_text = $('.legal span:nth-child(2)').text();



        if (useHTML5Player()) {
            var pwidth = (pwidth ? pwidth : "480");
            var pheight = (pheight ? pheight : "270");
            // create a HTML5 player.  To make the player fit the browser, leave off the dimensions.
            tpRegisterID("player");
            player = new Player('embedDiv', pwidth, pheight);
           // player.pluginOmniturehtml5="type=tracking|URL="+config.pdk_prefix+"/pdk/js/plugins/omnitureMedia.js|debug=false|trackEvents=event17|a.media.milestones=event48,event49,event50,event20|a.media.view=event17|a.media.timePlayed=event19|trackEvents=event17,event19,event48,event49,event50,event20|useJS=true|trackMilestones=25%25,50%25,75%25,95%25";
           // player.pluginOmniturehtml5+="|monitor=$pdk.controller.addEventListener('OnReleaseStart', function(e) {s['eVar24']=e.data.mediaPID; s['prop24']=e.data.mediaPID; })|trackVars=eVar24,prop24";
            player.pluginComScoreJS = "type=analytics|URL=https://sb.scorecardresearch.com/c2/plugins/streamsense_plugin_theplatform.js|labelmapping=ns_st_cl%3Dclip.length%2Cns_st_pl%3Dplaylist.title%2Cns_st_pr%3Dplaylist.feed%2Cns_st_ep%3Dplaylist.title%2Ctp_aid%3Dplaylist.accountID%2Ctp_st_cat%3Dbaseclip.categories%2Ctp_st_mp%3Dplaylist.player|sendErrors=true|c2=9924155|priority=1|persistentlabels=c1%3D2%2Cns_site%3Dtpf%2Ctp_cid%3DFIDL-NEW%2Ctp_type%3Dproduction|timinglabel=tp_st_ps|sendload=true";
            player.runtime = 'HTML5';
            player.sharingSiteIds = "facebook,twitter";
            player.allowFullScreen = true;
            player.backgroundColor = '0x333333';
            player.controlBackgroundColor = '0x000000';
            player.controlColor = '0xFFFFFF';
            player.videoScalingMethod = 'resize';
            var url_pid = getUrlParameter("pid");
            if (url_pid != undefined && url_pid != null) {
                player.releaseURL = "https://link.theplatform.com/s/qlVTIC/" + url_pid + "?format=SMIL";
            }
            player.controlFrameColor = '0xFFFFFF';
            player.controlHighlightColor = '0xCC0000';
            player.controlHoverColor = '0x408800';
            player.controlSelectedColor = '0xFFFFFF';
            //player.params = "params=mbr%3Dtrue";
            player.params = "byContent=byFormat%3D" + getPlayerFormat();
            player.skinURL = config.pdk_prefix + '/pdk/skins/flat/flat.json';
            player.showNav = false;
            player.showTitle = false;



            player.loadProgressColor = '0xAAAAAA';
            player.pageBackgroundColor = '0xFFFFFF';
            player.playProgressColor = '0x418900';
            player.textBackgroundColor = '0x000000';
            player.textColor = '0xFFFFFF';
            player.scrubberColor = '0xFFFFFF';
            player.scrubberFrameColor = '0xFFFFFF';
            player.scrubTrackColor = '0x414140';
            player.videoScalingMethod = 'resize';
            player.sharingSiteIds = "facebook,twitter";
            player.layoutURL = config.pdk_prefix + '/data/metaLayout_forms.xml';
            player.allowFullScreen = true;
            player.autoPlay = false;
            player.showNav = false;
            player.showBitrate = true;
            player.params = "params=mbr%3Dtrue";

            player.logLevel = 'none';
            //player.layoutURL = config.pdk_prefix + '/data/metaLayout_floatingControls.xml';
            if (Share_Embed_Code_Found == true || Share_Embed_Code_Found == "true") {
                player.embeddedPlayerHTML = "<embed src='http://player.theplatform.com/p/qlVTIC/yVSWEpFudZ5l/embed/select/{releasePid}' width='100%' height='100%' allowFullScreen='true' webkitallowfullscreen='true' mozallowfullscreen='true' bgcolor='#ffffff' sharingSiteIds='facebook,twitter'/>";
                player.playerURL = "http://player.theplatform.com/p/qlVTIC/yVSWEpFudZ5l/select/{releasePid}";
                player.sharingSiteIds = "facebook,twitter";
            }
            else {
                player.sharingSiteIds = "none";
                player.allowLink = false;
            }
            //player.showBitrate = true;


            /* $('.responsive-horizontal-hub .player-info #embedDiv').css('height','');  */


        }
        else {
            document.getElementById("embedDiv").innerHTML = "<div class='error-message'><p>If you are using Internet Explorer, you must update your browser to view this video. <a href='http://windows.microsoft.com/en-us/internet-explorer/download-ie' target='_blank'>Click here</a>.</p></div>";
        }

        player.previewImageAssetType = "704x396 Poster";
        player.bind();

        initHubInfo();

    }


    function handlePlayerReload(event) {
        if (!firsttime && releasePid != "" && releasePid != null) {
            tpController.loadReleaseURL("https://link.theplatform.com/s/qlVTIC/" + releasePid, true);
        }
    }

    function initHubInfo() {
        tpController.addEventListener("OnLoadReleaseUrl", handleRelease);
        tpController.addEventListener("OnMediaStart", handleHubClip);
    }

    function handleRelease(event) {
        window.videoReleaseEvent = event;
        var clip = event.data;
        var value = clip.pid;
        releasePid = value;
        if (firsttime && releasePid != "" && releasePid != null) {
            tpController.loadReleaseURL("https://link.theplatform.com/s/qlVTIC/" + releasePid, true);
            firsttime = false;
        }
        var div = document.getElementById("clipInfoDiv");
        div.style.display = "block";

        var releasediv = document.getElementById("release-info");
        releasediv.style.display = "block";
        document.getElementById("clipTitle").innerHTML = (clip.title ? clip.title : "");
        document.getElementById("clipDescription").innerHTML = (clip.description ? clip.description : "") + " <p class='clipTranscript' id='clipTranscript'><a href='javascript:void(0);' class='ClipLink' target='_blank' id='ClipTranscriptLink'><br>View full transcript (PDF)</br></a></p>";

        // If the copyright doesnt start with a character code of 169
        // then we add a copyright symbol
        if (clip.copyright.length > 0 && clip.copyright.charCodeAt(0) !== 169) {
            clip.copyright = "&copy; ".concat(clip.copyright);
        }
        document.getElementById("clipCopyRight").innerHTML = (clip.copyright ? clip.copyright : "");

        var transcriptLink;
        var newDisclaimerText;
        var shareEmbed = false;

        if (clip.customValues) {
            for (i = 0; i < clip.customValues.length; i++) {
                if (clip.customValues[i].fieldName == "Disclaimer_text" || clip.customValues[i].fieldName == "DISCLAIMER_TEXT") {
                    if (clip.customValues[i].value)
                        newDisclaimerText = clip.customValues[i].value;
                }
                if (clip.customValues[i].fieldName == "Disclaimer_Displayed" || clip.customValues[i].fieldName == "DISCLAIMER_DISPLAYED") {
                    if (clip.customValues[i].value && clip.customValues[i].value == true && parameters == false) {
                        disclaimerDisplayed = true;
                    }
                }
                if (clip.customValues[i].fieldName == "Video_Transcript" || clip.customValues[i].fieldName == "VIDEO_TRANSCRIPT") {
                    if (clip.customValues[i].value)
                        transcriptLink = clip.customValues[i].value;
                }

            }
        }


        if (newDisclaimerText == "" || newDisclaimerText == null) {
            document.getElementById("legalInfo").style.display = "none";
        }
        else {
            document.getElementById("legalInfo").style.display = "block";
            document.getElementById("disclaimerDiv").innerHTML = newDisclaimerText;
            document.getElementById("disclaimerDiv").style.display = "none";
            document.getElementById('legalinfotext').className = "fancyexpand";
            if (hubDisclaimerDisplayed == true || hubDisclaimerDisplayed == "true") {
                toggleHubDisclaimer();
            }
        }
        if (transcriptLink == "" || transcriptLink == null) {
            document.getElementById("clipTranscript").style.display = "none";
        }
        else {
            document.getElementById("clipTranscript").style.display = "inline";
            document.getElementById("ClipTranscriptLink").href = transcriptLink;
        }


    }

    function releaseList(feedUrl) {

        // releaselist2 is for loading the poster image.
        // It also controls the autplay settings
        // releaselist is primarily just for displaying the HTML5 list of videos
        // You cant load a poster image for a flash player from an html5 release list,
        // which is what releaselist is (.runtime = html5)

        // TODO: Use universal runtime to avoid needing two release lists
        feedUrl = feedcheck(feedUrl);


        // set selectedPID on release lists

//  tpRegisterID("releaselist");
        $('#release-info').append('<div id="helloDiv" style="display:none"></div>');
        var releaselist = new ReleaseList("releaseListDiv", "100%", "100%");
        releaselist.scopes = "embedDiv,release_model";
        var releaselist2 = new ReleaseList("helloDiv", "0", "0");
        releaselist2.scopes = "embedDiv,release_model";
        releaselist2.showMetadata = "true";
        releaselist2.showTitle = "true";
        releaselist2.showThumbnail = "true";
        releaselist2.showDescription = "false";
        releaselist2.showFormat = "false";
        releaselist2.showFrame = "false";
        releaselist2.columns = "10";
        releaselist2.autoLoad = "true";
        releaselist2.autoPlay = "false";

        if (global_autoplay_On == true) {
            releaselist2.autoPlay = "true";
            releaselist.autoPlay = "true";
        } else {
            releaselist2.autoPlay = "false";
            releaselist.autoPlay = "false";
        }


        releaselist2.itemsPerPage = "30";


        releaselist.showMetadata = "true";
        releaselist.showTitle = "true";
        releaselist.showThumbnail = "true";
        releaselist.showDescription = "false";
        releaselist.showFormat = "false";
        releaselist.showFrame = "false";
        releaselist.showLength = "true";
        releaselist.columns = "1";
        releaselist.runtime = "html5";
        releaselist.autoLoad = "false";
        releaselist.autoPlay = "false";
        releaselist.itemsPerPage = "30";


        if (Hubautoplay_On_Found == true || Hubautoplay_On_Found == "true") {
            releaselist2.playAll = "true";
            releaselist.playAll = "true";
        }
        else {
            releaselist2.playAll = "false";
            releaselist.playAll = "false";
        }

        releaselist.hasOverlay = "false";

        // We want to let users specify a video to start on.
        // get the param from the URL
        var url_pid = getUrlParameter("pid");

        if (url_pid != undefined) {
            releaselist.selectedPID = url_pid;
            releaselist2.selectedPID = url_pid;
        } else {

        }


        //releaselist.showBitrate = true;
        releaselist2.bind();
        releaselist.bind();

    }

    function releaseModel(feedUrl) {
        feedUrl = feedcheck(feedUrl);
        var releasemodel = new ReleaseModel("releaseModelDiv", "100%", "100%");
        releasemodel.feedsServiceUrl = feedUrl;
        releasemodel.scopes = "release_model";
        releasemodel.startIndex = 1;
        releasemodel.endIndex = 30;
        releasemodel.params = "byContent=byFormat%3Dmpeg4%7Cmp3&params=mbr%3Dtrue";
        releasemodel.bind();
    }

    function handleHubClip(event) {
        var clip = event.data;
        var div = document.getElementById("clipInfoDiv");
        div.style.display = "block";
        document.getElementById("clipTitle").innerHTML = (clip.baseClip.title ? clip.baseClip.title : "");
        document.getElementById("clipDescription").innerHTML = (clip.baseClip.description ? clip.baseClip.description : "") + " <p class='clipTranscript' id='clipTranscript'><a href='javascript:void(0);' class='ClipLink' target='_blank' id='ClipTranscriptLink'><br>View full transcript (PDF)</br></a></p>";
        document.getElementById("clipCopyRight").innerHTML = (clip.baseClip.copyright ? clip.baseClip.copyright : "");

        var transcriptLink;
        var newDisclaimerText;


        if (clip.baseClip.contentCustomData.Disclaimer_text) {
            newDisclaimerText = clip.baseClip.contentCustomData.Disclaimer_text;
        }
        else if (clip.baseClip.contentCustomData.DISCLAIMER_TEXT) {
            newDisclaimerText = clip.baseClip.contentCustomData.DISCLAIMER_TEXT;
        }

        if ($('.legal span:nth-child(2)').length == 0) {
            $('<span />').insertAfter('.legal span:nth-child(1)');
        } else {

        }

        if (clip.baseClip.contentCustomData.Static_legal_text) {
            $('.legal span:nth-child(2)').text(" " + clip.baseClip.contentCustomData.Static_legal_text);
        } else if (clip.baseClip.contentCustomData.STATIC_LEGAL_TEXT) {
            $('.legal span:nth-child(2)').text(" " + clip.baseClip.contentCustomData.STATIC_LEGAL_TEXT);
        } else {
            $('.legal span:nth-child(2)').text(" " + original_Static_legal_text);
        }

        if (clip.baseClip.contentCustomData.Video_Transcript) {
            transcriptLink = clip.baseClip.contentCustomData.Video_Transcript;
        }
        else if (clip.baseClip.contentCustomData.VIDEO_TRANSCRIPT) {
            transcriptLink = clip.baseClip.contentCustomData.VIDEO_TRANSCRIPT;
        }
        if (clip.baseClip.contentCustomData.Disclaimer_Displayed) {
//    disclaimerDisplayed = clip.baseClip.contentCustomData.Disclaimer_Displayed;
        }
        else if (clip.baseClip.contentCustomData.DISCLAIMER_DISPLAYED) {
//    disclaimerDisplayed = clip.baseClip.contentCustomData.DISCLAIMER_DISPLAYED;
        }

        if (newDisclaimerText == "" || newDisclaimerText == null) {
            document.getElementById("legalInfo").style.display = "none";
            document.getElementById("disclaimerDiv").style.display = "none";
        }
        else {
            document.getElementById("legalInfo").style.display = "block";
            document.getElementById("disclaimerDiv").innerHTML = newDisclaimerText;
            document.getElementById("disclaimerDiv").style.display = "none";
            document.getElementById('legalinfotext').className = "fancyexpand";
            if (hubDisclaimerDisplayed == true || hubDisclaimerDisplayed == "true") {
                toggleHubDisclaimer();
            }

        }
        if (transcriptLink == "" || transcriptLink == null) {
            document.getElementById("clipTranscript").style.display = "none";
        }
        else {
            document.getElementById("clipTranscript").style.display = "inline";
            document.getElementById("ClipTranscriptLink").href = transcriptLink;
        }
    }

    function toggleHubDisclaimer() {
        var sourceLink = document.getElementById('legalinfotext');
        var disclaimer = document.getElementById('disclaimerDiv');
        if (disclaimer.style.display == "none" || disclaimer.style.display == "") {
            disclaimer.style.display = "block"
            sourceLink.className = "fancycollapse";
        }
        else {
            disclaimer.style.display = "none"
            sourceLink.className = "fancyexpand";
        }
    }


    function callbackFunction(releasePid, pwidth, pheight) {
        // TODO: escape releasePid
        var URL = "https://link.theplatform.com/s/qlVTIC/" + releasePid + "?format=preview";
        $.ajax({
            type: 'GET',
            url: URL,
            dataType: 'jsonp',
            success: function (data) {


                var clip = data;

                var div = document.getElementById("clipInfoDiv");
                div.style.display = "block";
                document.getElementById("clipTitle").innerHTML = (clip.title ? clip.title : "");
                document.getElementById("clipDescription").innerHTML = (clip.description ? clip.description : "") + " <p class='clipTranscript' id='clipTranscript'><a href='javascript:void(0);' class='ClipLink' target='_blank' id='ClipTranscriptLink'><br>View full transcript (PDF)</br></a></p>";
                document.getElementById("clipCopyRight").innerHTML = (clip.copyright ? "&copy " + clip.copyright : "");

                var transcriptLink;
                var newDisclaimerText;

                if (clip.pl2$Disclaimer_Displayed != undefined && clip.pl2$Disclaimer_Displayed != null && article_parameters == false) {
                    disclaimerDisplayed = clip.pl2$Disclaimer_Displayed;
                } else {
                    //    disclaimerDisplayed = false;
                }


                transcriptLink = clip.pl2$Video_Transcript;
                newDisclaimerText = clip.pl1$Disclaimer_text;

                var static_legal_text = clip.pl1$Static_legal_text;

                if (static_legal_text != undefined && static_legal_text != null) {
                    if ($('.legal span:nth-child(2)').length == 0) {
                        $('<span />').insertAfter('.legal span:nth-child(1)');
                    } else {

                    }
                    $('.legal span:nth-child(2)').text(" " + static_legal_text);
                }
                if (newDisclaimerText == "" || newDisclaimerText == null) {
                    document.getElementById("legalInfo").style.display = "none";
                }
                else {
                    document.getElementById("legalInfo").style.display = "block";
                    document.getElementById("disclaimerDiv").innerHTML = newDisclaimerText;
                    document.getElementById("disclaimerDiv").style.display = "none";
                    if (disclaimerDisplayed == true || disclaimerDisplayed == "true") {
                        toggleDisclaimer();
                    }
                }

                if (transcriptLink == "" || transcriptLink == null) {
                    document.getElementById("clipTranscript").style.display = "none";
                }
                else {
                    document.getElementById("clipTranscript").style.display = "inline";
                    document.getElementById("ClipTranscriptLink").href = transcriptLink;
                }
                initfunction(releasePid, pwidth, pheight);
            }
        });
    }

    function useHTML5Player() {
        var testVideoTag = document.createElement("video");
        if (testVideoTag.canPlayType)
            return true;
        else
            return false;
    }

    function isAppleProduct() {
        return navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i);
    }

// choose the format for the player.  As above, you can make this conditional on user agent.
// You can also include codec information in this check, and distinguish the different codecs
// in the feed request below.

    // TODO: Add in responsive video classes
    function getPopInCheckString() {
        var classes = ['.medium-videohub', '.large-videohub', '.videomedium', '.videolarge', '.videosmall', '.videoxsmall', '.videohub','.responsive-vertical-hub'];
        var str = '';
        var prepend = '.popin--container';
        for (var i = 0; i < classes.length; i++) {
            str += prepend + ' ' + classes[i] + ',';
        }

        str = str.substring(0, str.length - 1);
        return str;
    }

    function getPopInTcmString() {
        var classes = ['.medium-videohub', '.large-videohub', '.videomedium', '.videolarge', '.videosmall', '.videoxsmall', '.videohub','.responsive-vertical-hub'];
        var str = '';

        var prepend = '[data-fmrTocTcmId]:has(';
        for (var i = 0; i < classes.length; i++) {
            str += prepend + ' ' + classes[i] + '),';
        }

        str = str.substring(0, str.length - 1);
        return str;
    }

    function onPopInPage() {
        if ($(getPopInCheckString()).length != 0) {
            return true;
        } else {
            return false;
        }
    }

    function setupPopIn(pwidth, pheight) {
        popInPage = true;
        // get the tcm that identifies this video
        var tcm = $(getPopInTcmString()).attr('data-fmrtoctcmid');
        // get the link responsible for this popin
        var link = $('[onclick*="' + tcm + '"]');
        var close = $('[popintcmid="' + tcm + '"] .popin--close-button');

        // TODO: Write some documentation on this code
        // Why are doing this? What isn't supported and the reasons for the workaround
        $(link).click(function (e) {
            var tcm = $(getPopInTcmString()).attr('data-fmrtoctcmid');
            // get the link responsible for this popin
            var link = $('[onclick*="' + tcm + '"]');
            var close = $('[popintcmid="' + tcm + '"] .popin--close-button');

            var el = $(close)[0],
                elClone = el.cloneNode(true);
            el.parentNode.replaceChild(elClone, el);
            close = $(elClone);

            if (window.firstClick) {

                callbackFunction(releasePid, pwidth, pheight);
                $(close).click(function (e) {
                    $pdk.controller.pause(true);

                    $(close).closest('.popin').css('visibility', 'hidden');
                    $(close).closest('.popin').find('*').css('visibility', 'hidden');
                });
                window.firstClick = false;

            } else {

                $(close).closest('.popin').css('visibility', 'visible');
                $(close).closest('.popin').find('*').css('visibility', 'visible');

                $(close).click(function (e) {

                    $pdk.controller.pause(true);
                    $(close).closest('.popin').css('visibility', 'hidden');
                    $(close).closest('.popin').find('*').css('visibility', 'hidden');

                });
            }
        });
    }


    function getPlayerFormat() {
        var testVideoTag = document.createElement("video");
        var format = "MPEG4";
        if (testVideoTag.canPlayType) {
            if (testVideoTag.canPlayType("video/webm"))
                format = "WebM";
            else if (testVideoTag.canPlayType("video/mp4"))
                format = "MPEG4";
            else if (testVideoTag.canPlayType("video/ogg"))
                format = "Ogg";
        }
        return format;
    }


    function initPlayer_old(releasePid, pwidth, pheight) {

        $(document).ready(function () {
            if (onPopInPage()) {
                setupPopIn(pwidth, pheight);
            } else {
                callbackFunction(releasePid, pwidth, pheight);
            }


            $.getScript(config.pdk_prefix+'/../55/pdk/qos/1.3/tpLegacyQos.js').done(function (script, status) {

            }).fail(function (jqxhr, settings, exception) {

            });
        });
        addIdForSingle(releasePid);
    }

    function initPlayer(releasePid, pwidth, pheight, share, autoplay, disclaimer_expanded) {
        if (arguments.length != 3) {
            global_autoplay_On = (autoplay != null) ? autoplay : false;
            global_Share_Embed_Code = (share != null) ? share : false;
            disclaimerDisplayed = (disclaimer_expanded != null) ? disclaimer_expanded : false;
        } else {
            article_parameters = false;
        }
        initPlayer_old(releasePid, pwidth, pheight);
        addIdForSingle(releasePid);
    }

    function addIdForHub(feedUrl){
        n = feedUrl.lastIndexOf('/');
        feedID = feedUrl.substring(n+1);
        $('#embedDiv').attr('data-feedID',feedID);
        $('#embedDiv').attr('data-feedID',feedID);

    }
    function addIdForSingle(releasePid){
        $('#embedDiv').attr('data-videoID', releasePid);
    }

    function initfunction(releasePid, pwidth, pheight) {
        if (useHTML5Player()) {

            var publicid = releasePid;
            tpRegisterID("player");
            var player = new Player('embedDiv');

            //player.pluginOmniturehtml5="type=tracking|URL="+config.pdk_prefix+"/pdk/js/plugins/omnitureMedia.js|debug=false|trackEvents=event17|a.media.milestones=event48,event49,event50,event20|a.media.view=event17|a.media.timePlayed=event19|trackEvents=event17,event19,event48,event49,event50,event20|useJS=true|trackMilestones=25%25,50%25,75%25,95%25";
           // player.pluginOmniturehtml5+="|monitor=$pdk.controller.addEventListener('OnReleaseStart', function(e) {s['eVar24']=e.data.mediaPID; s['prop24']=e.data.mediaPID; })|trackVars=eVar24,prop24";
            player.pluginComScoreJS = "type=analytics|URL=https://sb.scorecardresearch.com/c2/plugins/streamsense_plugin_theplatform.js|labelmapping=ns_st_cl%3Dclip.length%2Cns_st_pl%3Dplaylist.title%2Cns_st_pr%3Dplaylist.feed%2Cns_st_ep%3Dplaylist.title%2Ctp_aid%3Dplaylist.accountID%2Ctp_st_cat%3Dbaseclip.categories%2Ctp_st_mp%3Dplaylist.player|sendErrors=true|c2=9924155|priority=1|persistentlabels=c1%3D2%2Cns_site%3Dtpf%2Ctp_cid%3DFIDL-NEW%2Ctp_type%3Dproduction|timinglabel=tp_st_ps|sendload=true";

            player.fp.wmode = 'transparent';
            player.fa.scale = "noscale";

            player.fa.salign = "tl";
            //player.fp.bgcolor = '#ffffff';
            player.skinURL = config.pdk_prefix + '/pdk/skins/flat/flat.json';

            player.videoScalingMethod = 'resize';
            player.backgroundColor = '0x333333';
            player.controlBackgroundColor = '0x000000';
            player.controlColor = '0xFFFFFF';
            player.controlFrameColor = '0xFFFFFF';
            player.controlHighlightColor = '0xCC0000';
            player.controlHoverColor = '0x408800';
            player.controlSelectedColor = '0xFFFFFF';
            player.loadProgressColor = '0xAAAAAA';
            player.pageBackgroundColor = '0xFFFFFF';
            player.playProgressColor = '0x418900';
            player.textBackgroundColor = '0x000000';
            player.textColor = '0xFFFFFF';
            player.scrubberColor = '0xFFFFFF';
            player.scrubberFrameColor = '0xFFFFFF';
            player.scrubTrackColor = '0x414140';

            //player.params = "params=mbr%3Dtrue";   
            player.params = "byContent=byFormat%3D" + getPlayerFormat();
            player.layoutURL = config.pdk_prefix + '/data/metaLayout_forms.xml';  //  player.layoutURL = config.pdk_prefix + '/data/metaLayout_floatingControls.xml';
            player.allowFullScreen = true;
            player.releaseURL = "https://link.theplatform.com/s/qlVTIC/" + releasePid + "?mbr=true";

            //player.params = "byContent=byFormat%3D" + getPlayerFormat();
            //player.skinURL = config.pdk_prefix+'/pdk/skins/flat/flat.json';
            //player.controlSelectedColor = '0x408800';


            if (global_autoplay_On == true || global_autoplay_On == "true") {
                player.autoPlay = true;
            }
            else {
                player.autoPlay = false;
            }
            if (global_Share_Embed_Code == true || global_Share_Embed_Code == "true") {
                player.embeddedPlayerHTML = "<embed src='http://player.theplatform.com/p/qlVTIC/yVSWEpFudZ5l/embed/select/{releasePid}' width='100%' height='100%' allowFullScreen='true' bgcolor='#ffffff' sharingSiteIds='facebook,twitter'/>";
                player.playerURL = "http://player.theplatform.com/p/qlVTIC/yVSWEpFudZ5l/select/{releasePid}";
                player.sharingSiteIds = "facebook,twitter";
            }
            else {
                player.sharingSiteIds = "none";
                player.allowLink = false;
            }

            player.showNav = false;
            player.showTitle = false;

            player.useFloatingControls = false;
            player.showBitrate = true;


            player.allowFullScreen = true;

            player.logLevel = 'none';


        }

        else {
            document.getElementById("embedDiv").innerHTML = "<div class='error-message'><p>If you are using Internet Explorer, you must update your browser to view this video. <a href='http://windows.microsoft.com/en-us/internet-explorer/download-ie' target='_blank'>Click here</a>.</p></div>";
        }
        // This line of code is due to a bug fix.
        // It is from ThePlatform changing how they choose which poster image to display.
        player.previewImageAssetType = "704x396 Poster";
        player.bind();



    }

    function toggleDisclaimer() {
        var sourceLink = document.getElementById('legalinfotext');
        var disclaimer = document.getElementById('disclaimerDiv');
        if (disclaimer.style.display == "none" || disclaimer.style.display == "") {
            disclaimer.style.display = "block"
            sourceLink.className = "fancycollapse";
        }
        else {
            disclaimer.style.display = "none"
            sourceLink.className = "fancyexpand";
        }
    }

    // Globals for backward compatibility
    this.initHubPlayer = initHubPlayer;
    this.initHubInfo = initHubInfo;
    this.releaseList = releaseList;
    this.releaseModel = releaseModel;
    this.initPlayer = initPlayer;
    this.toggleDisclaimer = toggleDisclaimer;
    this.toggleHubDisclaimer = toggleHubDisclaimer;

    return {
        initPlayer: initPlayer,
        initHubPlayer: initHubPlayer,
        initHubInfo: initHubInfo,
        releaseList: releaseList,
        releaseModel: releaseModel
    };
})();


/* This part of code is responsible for displaying release list
 as a dropdown option below 503px.
 */
$(document).ready(function(){

    function hubPlayerDropDown(){
        if($("#releaseListDiv li.tpRelease").length > 0){
            $("#hubPlayerDropDown").empty();
            $("#releaseListDiv li.tpRelease").each(function(){
                $("#hubPlayerDropDown").append("<option value='+ $(this).text() +'>"+ $(this).text() +"</option>");

            });
        }
        else{
            setTimeout(function(){hubPlayerDropDown()}, 1000);
        }
        /* Setting up height of the video Embeddiv in order to remove black border around video player */

        $(".video-responsive-single #embedDiv").css("height", "15px");
        $(".responsive-vertical-hub #embedDiv, .responsive-horizontal-hub #embedDiv").css("height", "19px");

        /*Addition for accessibility controls to make sure the play button is always accessible
         This was a last resort, if there is a better place to move this to, do so*/
        $(".tpPlay table canvas").addClass("accessibleElement");
        $(".tpPlay table canvas").attr("accessible-element","accessible");
        $(".tpPlay table canvas").attr("tabindex","0");
        $(".tpPlay table canvas").attr("id","accessiblePlayButtonSmall");
        /*End Addition*/
    }

    hubPlayerDropDown();
    /* Identifying change event on video menu selection 
     and trigger Click
     */
    $("#hubPlayerDropDown").change(function(){

        var matchIndex = $("#hubPlayerDropDown")[0].selectedIndex;

        $($(".tpRelease a")[matchIndex]).trigger("click");

        /*Addition for accessibility to bring focus to the player after a selection has been made*/
        if(usingTab){
            elementInFocus("#embedDiv");
        }
        /*End of Addition*/

    });

});
/* Below function is used to calculate the height of video player + Clip Info section
 and implementing same height for releaseList (2nd column)
 */
$(document).ready(function(){


    function calculateVideoPlayerColumnHeight(){
        if(($("#releaseListDiv li.tpRelease").length > 0) && ($(".clipInfoTitle").height() > 0)){
            if(($(".responsive-vertical-hub #releaseListDiv li.tpRelease").length > 0)){
                var videoPlayerColumnHeight = $(".player-info").height();
                $("#release-info").css("height", videoPlayerColumnHeight);
                /* Tracking browser resize and setting height accordingly  */
                $(window).on("resize",function() {
                    videoPlayerColumnHeight = $(".player-info").height();
                    $("#release-info").css("height", videoPlayerColumnHeight);
                });
                /* Checking click action on legal information and calculating the height */
                $("#legalInfo a").on("click", function(){
                    videoPlayerColumnHeight = $(".player-info").height();
                    $("#release-info").css("height", videoPlayerColumnHeight);
                });
            }
        }
        else{
            setTimeout(function(){calculateVideoPlayerColumnHeight()}, 1000);
        }
    }
    calculateVideoPlayerColumnHeight();
    if( $(".video-full-screen").length >= 1 ) {
        showSingleVideoFullscreenOnElemClick();
    }
});


/*Begin Accessbility code addition, also see two small sections of accessbility code above*/


function makeElementAccessible(elementSelector, ariaLabel, accessibleId, ariaLive){
    $(elementSelector).attr("tabindex","0");
    $(elementSelector).addClass("accessibleElement");
    $(elementSelector).attr("accessible-element","accessible");
    if(typeof ariaLabel !== "undefined"){
        $(elementSelector).attr("aria-label",ariaLabel);
    }
    if(typeof accessibleId !== "undefined"){
        $(elementSelector).attr("id",accessibleId);
    }
    if(typeof ariaLive !== "undefined"){
        $(elementSelector).attr("aria-live",ariaLive);
    }

}
/*flag for if video is playing */
var playing = false;
/*flag for if this the first time the user has played the video in this session */
var firstPlay = true;
/*set by thePlatform but seems to always be at about 80*/
var presetVolume = 80;
/*flag for if a card that overlays on top of the video (i.e. Share or Info) is being shown*/
var isCardShown = false;

$pdk.controller.addEventListener("OnShowControls", addAccessibility);



function addAccessibility(){
    if(firstPlay){
        makeElementAccessible("#embedDiv","Video Player. Press here to play or pause video. Press the tab key to access all of the other controls.");
        makeElementAccessible(".tpPlay table canvas" , "Play button. Press here to start video.", "accessiblePlayButtonSmall");
    }
    else if(playing){
        makeElementAccessible(".tpPlay table canvas" , "Play. Press again to Pause.",  "accessiblePlayButtonSmall" );
        makeElementAccessible("#embedDiv","Video Player. Video is playing. Press again to Pause. Press the tab key to access all of the other controls.");
    }
    else if(!playing){
        makeElementAccessible(".tpPlay table canvas" , "Pause. Press again to Play.",  "accessiblePlayButtonSmall" );
        $( "#embedDiv" ).attr("aria-label","Video Player. Video is paused. Press again to Play. Press the tab key to access all of the other controls.");
    }
    makeElementAccessible("div[id*='playButtonHolder'] canvas", "Play button. Press here to start video.", "accessiblePlayButtonLarge");
    makeElementAccessible(".tpMute table canvas" , "Volume. Use the up arrow to increase volume and the down arrow to decrease volume.", "accessibleVolumeControl", presetVolume);
    makeElementAccessible(".tpScrubber .ScrubberThumbSkin","Scrubber. Use right arrow to go forward in the video timeline and the left arrow to go backward in the video timeline.", "accessibleScrubber", 0);
    makeElementAccessible(".tpFullScreen table canvas" , "Full screen. Press here to view the video in full screen mode. Then press the Escape button to exit full screen mode.", "accessibleFullScreenButton");
    makeElementAccessible(".tpMenu table tr" , "Menu. Press here to share or view information about the video.",  "accessibleMenuButton" );

    if($("#accessibleIconCC").length == 0){
        makeElementAccessible(".tpCC table canvas" , "Closed Captioning. Press here to view closed captions.",  "accessibleIconCC" );
    }

    $("#hubPlayerDropDown").attr("aria-label","Select video. Press here to select a video to watch from a list of available videos.");

    /*Video Tag is given aria-label property because Firefox makes it accessible by tabbing by default*/
    /*Chose to do it this way as to not mess up natural tabbing order of the page*/
    $("#embedDiv video").attr("aria-label","This is not a button. Please press tab again to access the rest of the controls.");
    $(".tpGrid").attr("aria-label","This is not a button. Please press tab again to access the rest of the controls.");

    /*After CC is clicked, thePlatform has tpRow gets focus. It is given an aria label to avoid confusion for the user*/
    $(".tpRow").attr("aria-label","This is not a button. Please press tab again to access the rest of the controls.");

}



$pdk.controller.addEventListener("OnShowCard", addMenuAccessibility);
function addMenuAccessibility(){
    isCardShown = true;
    makeElementAccessible(".tpMenuButtons .tpShare" ,"Share Button. Press here for options to share the video with others.", "accessibleShareButton");
    makeElementAccessible(".tpMenuButtons .tpInfo"  ,"Info Button. Press here for more information about the videos.", "accessibleInfoButton");
    makeElementAccessible(".tpNavButton .IconPost_big" ,"Post to a Site. Press here for options to share the video on facebook and twitter.", "accessibleNavPost");
    makeElementAccessible(".tpNavButton .IconLink_big" ,"Copy the link to the video. Press here to copy the link to the video.", "accessibleNavLink");
    makeElementAccessible(".tpNavButton .IconEmbed_big" ,"Get embed code. Press here to copy code to embed this video onto another site.", "accessibleNavEmbed");
    makeElementAccessible(".tpCardClose"  ,"Close share or info options. Press here to close the share or info option and return to the video.", "accessibleClose");
    makeElementAccessible(".tpCardForm .tpSelect" ,"Select Text. Press here to select the text available to copy the video link or embed code then press Control and C to copy it.", "accessibleSelect");
    makeElementAccessible(".tpPostSiteList a[href='#facebook']" ,"Share to facebook. Press here to share this video on facebook.", "accessibleFacebookSharing");
    makeElementAccessible(".tpPostSiteList a[href='#twitter']" ,"Share to twitter. Press here to share this video on twitter.", "accessibleTwitterSharing");
    /*Menu button becomes close button when Share+Info card is shown so label is updated*/
    $(".tpMenu table tr").attr("aria-label","Close Menu. Press here to close the menu options");

}

/*Sets properties of controls again when they have been repainted to the DOM by thePlatform*/
$pdk.controller.addEventListener("OnControlsRefreshed", controlsRefreshed);
$pdk.controller.addEventListener("OnHideCard", controlsRefreshed);
function controlsRefreshed(){
    isCardShown = false;
    addAccessibility();

}

var currentPercentComplete = 0;
$pdk.controller.addEventListener("OnMediaPlaying", mediaIsPlaying);
function mediaIsPlaying(timeObject){
    makeElementAccessible(".tpPlay table canvas" , "Play. Press again to Pause.",  "accessiblePlayButtonSmall" );
    makeElementAccessible("#embedDiv","Video Player. Video is playing. Press again to Pause. Press the tab key to access all of the other controls.");

    /*Added CC attributes here because the CC button does not show up until the video is playing*/
    if($("#accessibleIconCC").length == 0){
        makeElementAccessible(".tpCC table canvas" , "Closed Captioning. Press here to view closed captions.",  "accessibleIconCC" );
    }
    playing = true;
    firstPlay = false;
    currentPercentComplete=timeObject.data.percentComplete;

    /*Updates aria live attribute as video plays showing how many seconds you are into the video*/
    $( "#accessibleScrubber" ).attr("aria-live",Math.floor(timeObject.data.currentTime/1000));
}

/*Updates aria live attribute as user drags the scrubber to move to a different time in the video showing how many seconds you are into the video*/
$pdk.controller.addEventListener("OnMediaSeek", mediaSeeking);
function mediaSeeking(seekObject){
    currentPercentComplete=seekObject.data.end.percentComplete;
    $( "#accessibleScrubber" ).attr("aria-live",Math.floor(seekObject.data.end.currentTime/1000));

}
$pdk.controller.addEventListener("OnMediaPause", mediaIsNotPlaying);
function mediaIsNotPlaying(){
    playing = false;
    makeElementAccessible(".tpPlay table canvas" , "Pause. Press again to Play.", "accessiblePlayButtonSmall");
    $( "#embedDiv" ).attr("aria-label","Video Player. Video is paused. Press again to Play. Press the tab key to access all of the other controls.");
}
/*Reset happens here so user can choose to watch the video again*/
$pdk.controller.addEventListener("OnMediaEnd", mediaEnded);
function mediaEnded(){
    firstPlay = true;
    $( ".tpPlay table canvas" ).attr("aria-label","Play. Press again to Pause.");

}

var usingTab = false;
var lastAccessibleElement;

function elementInFocus(elementSelector){
    $(elementSelector).focus();
    if(elementSelector === "#embedDiv".trim()){
        $(elementSelector).css("outline","2px solid red");
    }
    else{
        $(elementSelector).css("outline","1px solid red");
    }
    lastAccessibleElement =  $(elementSelector).get();
}

function elementImitateClick(elementSelector){
    $(elementSelector).click();
    if(elementSelector === "#embedDiv".trim()){
        $(elementSelector).css("outline","2px solid red");
    }
    else{
        $(elementSelector).css("outline","1px solid red");
    }
}

/*Space or Enter should create the same affect as clicking a button. Enter is more likely to be what the user chooses*/
/*It is more important that the Enter commands work than the Space ones*/
$(document).keypress(function (e) {
    if (e.which == 32 || e.which == 13 ) {
        if(e.target.id == "accessiblePlayButtonLarge"){
            e.preventDefault();
            $pdk.controller.clickPlayButton();
            firstPlay = false;
            elementInFocus("#embedDiv");
        }
        else if(e.target.id == "accessiblePlayButtonSmall" || e.target.id =="embedDiv"){
            e.preventDefault();
            if(firstPlay){
                $pdk.controller.clickPlayButton();
            }
            else if(playing){
                $pdk.controller.pause(true);
            }
            else{
                $pdk.controller.pause(false);
            }
        }
        else if(e.target.id == "accessibleVolumeControl"){
            e.preventDefault();
            elementImitateClick(".tpMute table canvas" );
        }
        else if(e.target.id == "accessibleIconCC"){
            e.preventDefault();
            $(".tpCC table canvas").click();
            elementInFocus(".tpCC table canvas");

        }
        /*Fixes the fact that in IE, focus shifts to tpRow after clicking tpCC*/
        else if(e.target.className == "tpRow"  && $(e.target).has("#accessibleIconCC").length > 0){
            e.preventDefault();
            elementImitateClick(".tpCC table canvas");
            elementInFocus(".tpCC table canvas");
        }
        /*Space does not work for clicking full screen button in IE*/
        else if(e.target.id == "accessibleFullScreenButton"){
            e.preventDefault();
            $(".tpFullScreen table canvas" ).click();
            usingTab = true;

        }
        /*Doesn't do much, just prevents scrolling to bottom of page*/
        else if(e.target.id == "accessibleScrubber"){
            e.preventDefault();
            $(".tpCardForm .tpSelect" ).click();
        }
        /*Space does not work for clicking menu button in IE*/
        else if(e.target.id == "accessibleMenuButton"){
            e.preventDefault();
            $(".tpMenu table tr").click();
            $(".tpMenu table tr").css("outline","0px");
            if(isCardShown){
                elementInFocus(".tpMenuButtons .tpShare");
                /*Info goes into focus if Share is not there*/
                if($(".tpMenuButtons .tpShare").length == 0){
                    elementInFocus(".tpMenuButtons .tpInfo");
                }
            }
            else{
                elementInFocus("#embedDiv");
            }
        }
        /*Focuses on first of 3 share options after share button is clicked*/
        else if(e.target.id == "accessibleShareButton"){
            e.preventDefault();
            $(".tpMenuButtons .tpShare" ).click();
            elementInFocus(".tpNavButton .IconPost_big");
        }
        else if(e.target.id == "accessibleInfoButton"){
            e.preventDefault();
            $(".tpMenuButtons .tpInfo" ).click();
            elementInFocus("#embedDiv");
        }
        else if(e.target.id == "accessibleNavPost"){
            e.preventDefault();
            $(".tpNavButton .IconPost_big" ).click();
            elementInFocus(".tpNavButton .IconPost_big");
            addMenuAccessibility();

        }
        else if(e.target.id == "accessibleNavLink"){
            e.preventDefault();
            $(".tpNavButton .IconLink_big" ).click();
            elementInFocus(".tpNavButton .IconLink_big");
        }
        else if(e.target.id == "accessibleNavEmbed"){
            e.preventDefault();
            $(".tpNavButton .IconEmbed_big" ).click();
            elementInFocus(".tpNavButton .IconEmbed_big");
        }
        else if(e.target.id == "accessibleClose"){
            e.preventDefault();
            $(".tpCardClose .PlayerLabelFont").click();
            $(".tpPlay table canvas").addClass("accessibleElement");
            elementInFocus("#embedDiv");
        }
        else if(e.target.id == "accessibleSelect"){
            e.preventDefault();
            $(".tpSelect table div" ).click();
            elementInFocus(".tpSelect table div");
        }
        /*Makes the release list thumbnails clickable with spacebar and gives focus to embedDiv*/
        else if(e.target.tagName == "A"
            && $(e.target).has(".tpInfo").length > 0
            && $(e.target).has(".tpThumbnail").length > 0
            && $(e.target).has(".tpMetadata").length > 0 ){
            e.preventDefault();
            $(e.target)[0].click();
            $(lastAccessibleElement).css("outline","0px");
            elementInFocus("#embedDiv");
        }
        else if(e.target.tagName == "A" && e.target.id == "ClipTranscriptLink"){
            e.preventDefault();
            $(e.target).click( function() {
                window.open(e.target.href);
            });
            $(e.target).click();

        }
        /*For hub videos, opens and closes disclaimer*/
        else if(e.target.tagName == "A" && e.target.id == "legalinfotext"){
            e.preventDefault();
            toggleHubDisclaimer();
        }
    }
});

/*Updates aria-live with current volume level*/
$pdk.controller.addEventListener("OnVolumeChange", volumeChanged);
function volumeChanged(volume){
    $(".tpMute table canvas").attr("aria-live",Math.floor(volume.data));
}

$pdk.controller.addEventListener("OnMute", volumeMuted);
function volumeMuted(muted){
    if(muted.data){
        $(".tpMute table canvas").attr("aria-live",Math.floor(0));
    }
    else{
        $(".tpMute table canvas").attr("aria-live",Math.floor(presetVolume));
    }
}

/* Controls tab, shift+tab, up, down, end, home button functionality*/
$(document).keydown(function (e) {
    /*Shfit + Tab goes backward in the DOM so embedDiv needs to then have no outline*/
    if(e.which == 9 && e.shiftKey && e.target.id == "embedDiv"){
        $(e.target).css("outline","0px");
    }
    /*Menu button is the last video control and needs have no outline when you tab to the next element*/
    if(e.which == 9 && e.target.id == "accessibleMenuButton"){
        $(e.target).css("outline","0px");
    }
    /*When Share card is open, focus goes from select button to embedDiv when tabbing (Embed code and post link options)*/
    if(e.which == 9 && !e.shiftKey && e.target.id == "accessibleSelect" ){
        e.preventDefault();
        $("#embedDiv").focus();
    }
    /*When Share card is open, focus goes from twitter button to embedDiv when tabbing (Share on social media option)*/
    else if(e.which == 9 && e.target.id == "accessibleTwitterSharing"){
        e.preventDefault();
        $("#embedDiv").focus();

    }
    /*When Share+Info card is open, focus goes from info to menu/close button*/
    else if(e.which == 9 && !e.shiftKey && e.target.id == "accessibleInfoButton"){
        e.preventDefault();
        $("#accessibleMenuButton").focus();

    }
    /*tpRow gets focus when CC is clicked. This returns focus back to accessibleIconCC*/
    else if(e.which == 9 && e.target.className == "tpRow" && $(e.target).has("#accessibleIconCC").length > 0 ){
        e.preventDefault();
        $("#accessibleIconCC").focus();
    }
    /*Raise volume with up arrow*/
    else if (e.keyCode == 38 && e.target.id == "accessibleVolumeControl") {    //up
        e.preventDefault();
        if(presetVolume < 100){
            presetVolume +=10;
        }
        $pdk.controller.setVolume(presetVolume);

    }
    /*Lower volume with down arrow*/
    else if(e.keyCode == 40 && e.target.id == "accessibleVolumeControl"){   //down
        e.preventDefault();
        if(presetVolume > 0){
            presetVolume -=10;
        }
        $pdk.controller.setVolume(presetVolume);

    }
    /*Fast forward by 10 percent more into the video*/
    else if(e.keyCode == 37 && e.target.id == "accessibleScrubber"){ //left 
        e.preventDefault();
        if(currentPercentComplete > 11){
            currentPercentComplete -=10;
        }
        else{
            currentPercentComplete = 0;
        }
        $pdk.controller.seekToPercentage(currentPercentComplete);
    }
    /*Rewind by 10 percent less into the video*/
    else if(e.keyCode == 39 && e.target.id == "accessibleScrubber" ){ //right
        e.preventDefault();
        if(currentPercentComplete < 90){
            currentPercentComplete +=10;
        }
        else{
            currentPercentComplete = 99;
        }
        $pdk.controller.seekToPercentage(currentPercentComplete);
    }
    /*End button takes you to end of video*/
    else if (e.which == 35 && e.target.id == "accessibleScrubber") { //End
        e.preventDefault();
        $pdk.controller.seekToPercentage(99);
    }
    /*Home button takes you to start of of video*/
    else if (e.which == 36 && e.target.id == "accessibleScrubber") { //Home
        e.preventDefault();
        $pdk.controller.seekToPercentage(0);
    }
    /*End button takes you to highest volume setting*/
    else if (e.which == 35 && e.target.id == "accessibleVolumeControl") { //End
        e.preventDefault();
        $pdk.controller.setVolume(100);
    }
    /*Home button takes you to lowest volume setting*/
    else if (e.which == 36 && e.target.id == "accessibleVolumeControl") { //Home
        e.preventDefault();
        $pdk.controller.setVolume(0);
    }
    /*Gives focus to embedDiv after enter key is pressed on hub thumbnails*/
    else if(e.which == 13 && e.target.tagName == "A"
        && $(e.target).has(".tpInfo").length > 0
        && $(e.target).has(".tpThumbnail").length > 0
        && $(e.target).has(".tpMetadata").length > 0) {
        $(e.target)[0].click();
        $(lastAccessibleElement).css("outline","0px");
        elementInFocus("#embedDiv");

    }



});
/*Flag to see if user clicks the video, can be used later to take off outline*/
var mediaClicking =  false;
$pdk.controller.addEventListener("OnMediaClick", mediaClicked);
function mediaClicked(){
    mediaClicking = true;
}
/*When user opens full screen, attempts to concentrate focus on play button, not fully functional in Firefox. In Firefox embedDiv gets focus*/
/*When user closes full screen, the embedDiv regains focus*/
$pdk.controller.addEventListener("OnShowFullScreen", showingFullScreen);
function showingFullScreen(isFullScreen){
    if(isFullScreen.data){

        if(!($(document.activeElement).hasClass("accessibleElement"))){
            if(usingTab){elementInFocus( ".tpPlay table canvas");}
        }
    }
    else{
        if(usingTab){elementInFocus("#embedDiv");}

    }
    $(".tpPlay table canvas").addClass("accessibleElement");
    $(".tpPlay table canvas").attr("accessible-element","accessible");
    $(".tpPlay table canvas").attr("tabindex","0");
    $(".tpPlay table canvas").attr("id","accessiblePlayButtonSmall");
}
/*Takes away the lastAccessibleElement (last accessible video element that was in focus) outline. Then sets the current element in focus as the lastAccessibleElement
 e.which = 9 is the Tab key*/
$(document).keyup(function (e) {
    if(e.which == 9){
        usingTab = true;
        mediaClicking =  false;
    }
    if(e.which == 9 && $(e.target).attr("accessible-element")){

        $(e.target).css("outline","1px solid red");
        if(e.target.id == "embedDiv"){
            $(e.target).css("outline","2px solid red");
        }
        if(e.target.id == "accessibleScrubber"){
            $(e.target).css("outline","2px solid red");
        }
        if(lastAccessibleElement && lastAccessibleElement.id != e.target.id){
            $(lastAccessibleElement).css("outline","0px")
        }
        lastAccessibleElement = e.target;
    }
    else if(e.which == 9 && e.target.tagName == "A"
        && $(e.target).has(".tpInfo").length > 0
        && $(e.target).has(".tpThumbnail").length > 0
        && $(e.target).has(".tpMetadata").length > 0){

        $(e.target).find(".tpMetadata").css("outline","1px solid red");
        if(lastAccessibleElement){
            $(lastAccessibleElement).css("outline","0px")
        }
        lastAccessibleElement = $(e.target).find(".tpMetadata");

    }


});

/*Takes outline away from lastAccessibleElement when user clicks anything*/
$("*").mousedown(function() {
    if(lastAccessibleElement){ $(lastAccessibleElement).css("outline","0px")};
    usingTab = false;
});


/*End Accessibility Code Addition */

/*
 ** Open a single video in Full screen Mode
 **
 ** @html clickable Link/Button/Image should contain class "video-full-screen"
 ** @html A class added in main <div> container called "full-screen-single-video"
 ** @html this <div> wraps around 'embedDiv'
 **
 ** @params {}
 ** @returns {}
 */
function showSingleVideoFullscreenOnElemClick() {

    /*
     ** "video-full-screen" class is link/button/image is present in the page,
     ** clicking it triggers fullscreen on video;
     */
    $( ".video-full-screen" ).on( "click" , function(event) {
        var x = 0;
        event.preventDefault();
        //iphone uses native player;
        //calling fullscreen does not work there;
        if(/iPad/.test(navigator.userAgent) && !window.MSStream){
            clearTimeout(x);
            x = setTimeout(function(){

                $pdk.controller.showFullScreen( true );
                $pdk.controller.clickPlayButton();
            },1000);

        }
        $pdk.controller.showFullScreen( true );
        $pdk.controller.clickPlayButton();
    });
    /*
     ** Handling event for change in fullscreen mode of player;
     **
     **
     ** This method handles exiting fullscreen by pressing Esc button or
     ** clicking on fullscreen icon on video or pressing back button
     ** button on handheld devices;
     */
    $pdk.controller.addEventListener( "OnShowFullScreen" , function( e ) {
        if( $( ".video-full-screen" ).length === 1 ) {
            var isfullscreen = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
            if( !isfullscreen ) {
                $pdk.controller.seekToPercentage(0);
                $pdk.controller.pause( true );
                $( ".full-screen-single-video" ).css( "display" , "none" );
            }
            else {
                $( ".full-screen-single-video" ).css( "display" , "block" );
                $( ".full-screen-single-video" ).css( "opacity" , 0 );
            }
        }
    });

    /*
     // This code exit from video full screen mode once video finish playing
     */
    $pdk.controller.addEventListener("OnMediaEnd", function() {
        $pdk.controller.showFullScreen();
    });

}


/* Written for NB requirement to display different type of information
 ** on given timestamp. Generic function is written so same can be used for other projects.
 */

$(window).load(function(){
    if($(".video-timestamp-text").length > 0){
        var playTime;
        var aggrTime;
        var timeInSec;
        var triggerOnceforShare = true;
        var timestamps = [],
            last = 0,
            all = 0,
            now = 0,
            old = 0,
            i=0;

        $('.video-timestamp-text').each(function(o){
            if($(this).attr('data-start')){

                timestamps.push({
                    start : +$(this).attr('data-start'),
                    end : +$(this).attr('data-end'),
                    elm : $(this)
                });
            }
        });
        all = timestamps.length;

        function showsection(t){
            for(i=0;i<all;i++){
                if(t >= timestamps[i].start && t <= timestamps[i].end){

                    timestamps[i].elm.css("display", "block");

                } else {

                    timestamps[i].elm.css("display", "none");
                }
            }
        }

        $pdk.controller.addEventListener("OnMediaPlaying", function(playEvent){
            playTime = playEvent.data.currentTimeAggregate;
            aggrTime = playTime/1000;
            timeInSec = Math.floor(aggrTime);
            showsection(timeInSec);
        });
    }
});


