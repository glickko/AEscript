// Copyright 2017 Adobe Systems Incorporated. All Rights Reserved.     
 
var METTLE_SCRIPT_TYPE = 
{
  CREATOR : 0, 
  EXTRACTOR: 1,
  COMPOSER: 2
};

var METTLE_EXTRACTOR_QUALITY = 
{
    LOW : 0,
    MEDIUM : 1,
    HIGH : 2,
    ULTRA : 3
 };

var METTLE_COMPOSITION_ASPECT_RATIO = 
{
    R_1_1 : 0,
    R_4_3 : 1,
    R_16_9 : 2,
    R_16_10 : 3
 };

var METTLE_OUTPUT_FORMAT = 
{
    CUBEMAP_4_3 : 0,
    SPHEREMAP : 1,
    EQUIMAP_2_1 : 2,
    FISHEYE : 3,
    CUBEMAP_FACEBOOK_3_2: 4,
    CUBEMAP_PANO2VR_3_2: 5,
    CUBEMAP_GEARVR_6_1: 6,
    EQUIMAP_16_9: 7
 };


 // IMPORTANT: The name of the function gets changed at runtime before execution
 // for the Creator/Extractor cases.  Composer is the "original" master version
//function mettleSkyBoxCreator(script_type, rootObject) // declare the function in order to have a separate namespace
//function mettleSkyBoxExtractor(script_type, rootObject) // declare the function in order to have a separate namespace
function mettleSkyBoxComposer(script_type, rootObject) // declare the function in order to have a separate namespace
{
    /* GLOBALS */

    // Effect disk IDs to prevent language dependency. Must match effect implementation!
    // IDs determined with Text layer / opt-pickwhip-expr trick
    var kEffectConverterPropertyInputID = 1;
    var kEffectConverterPropertyOutputID = 2;
    var kEffectConverterPropertyOutputWidthID = 3;
    var kEffectConverterPropertyTiltID = 6;
    var kEffectConverterPropertyPanID = 7;
    var kEffectConverterPropertyRollID = 8;
    var kEffectConverterPropertyInvertRotationID = 9;

    // Viewer
    var kEffectViewerPropertyInputID = 1;
    var kEffectViewerPropertyOutputWidthID = 2;
    var kEffectViewerPropertyOutputRatioID = 3;
    var kEffectViewerPropertyRotateXID = 5;
    var kEffectViewerPropertyRotateYID = 6;
    var kEffectViewerPropertyRotateZID = 7;
    var kEffectViewerPropertyRotateInvertID = 8;

    // Project2D
    var kEffectProject2DPropertyScaleID = 2;
    var kEffectProject2DPropertyProjTiltXID = 11;
    var kEffectProject2DPropertyProjPanYID = 12;
    var kEffectProject2DPropertyProjRollID = 13;

    ///// DO NOT LOCALIZE (e.g. MATCHNAMES) >>>>>
    // Intent:  remain compatible with original Mettle plugin!
    // matchname related
    var kConverterPluginMatchName = "Mettle SkyBox Converter";
    var kViewerPluginMatchName = "Mettle SkyBox Viewer";
    var kProject2DPluginMatchName = "Mettle SkyBox Project 2D";
    var kAdobeTrackerMatchName = "ADBE 3D Tracker";

    // pref related
    var kMainPrefSection = "Main Pref Section";
    var kPrefScriptingFileNetworkSecurity = "Pref_SCRIPTING_FILE_NETWORK_SECURITY";
    var kAppWarningPrefSection = "Application Warning Preference Section";
    var kPrefCamerasAndLightsAffectStuff = "Cameras and Lights affect stuff";


    /////// <<<<< DO NOT LOCALIZE

    ///// LOCALIZE WITH EXTREME CAUTION  >>>>>
    // Changing some these CAN BREAK finding layers/comps in old projects or corrupt future projects!
    // Approach: 
    // 1) GRANDFATHER/FREEZE original Mettle english name. 
    // 2) Move functional behavior to none-localized markers in the comment field.  FREEZE that
    // 3) Allow the english layer/comp names to be localized without touching function.  Remove functional dependency on layer/comp name as possible

    // camera related
    var kMasterCameraNameOriginalEnglish = "SkyBox Master Camera";    // FROZEN: DO NOT LOCALIZE/CHANGE!
    var kMasterCameraCommentMarker = "[VR-MasterCam]";                // FROZEN: DO NOT LOCALIZE/CHANGE!
    var kMasterCameraNameLocalize = localize("$$$/AE/Script/VR/MasterCamera=VR Master Camera");

    // camera directions a.k.a faces 1-6  (but arrays are base-0)
    var kCameraNamesPostfixOriginalEnglish = ["front", "right", "back", "left", "top", "bottom"];  // FROZEN: DO NOT LOCALIZE/CHANGE!
    var kCameraNamesPostfixLocalize =
        [   localize("$$$/AE/Script/VR/CamFaceFront=front"),
            localize("$$$/AE/Script/VR/CamFaceRight=right"),
            localize("$$$/AE/Script/VR/CamFaceBack=back"),
            localize("$$$/AE/Script/VR/CamFaceLeft=left"),
            localize("$$$/AE/Script/VR/CamFaceTop=top"),
            localize("$$$/AE/Script/VR/CamFaceBottom=bottom")];
                               
    var kFaceLayerNameFormatOriginalEnglish = "Face@1 (@2)";  // FROZEN: DO NOT LOCALIZE/CHANGE!
    var kFaceLayerCommentMarkerFormat = "[VR-Face@1]"       // FROZEN: DO NOT LOCALIZE/CHANGE!
    var kFaceLayerNameFormatLocalize = localize("$$$/AE/Script/VR/FaceLayerFormat=Face@1 (@2)");

    //            var camCompName = compNameWithPostfix(outputName, "cam" + cam_comp_i + "-" + kCameraNamesPostfixOriginalEnglish[cam_comp_i - 1]); 
    // camCompName = outputName + " (" + "cam" + cam_comp_i + "-" + kCameraNamesPostfixOriginalEnglish[cam_comp_i - 1] + ")";
    var kCameraCompNameSuffixFormatOriginalEnglish = " (cam@1-@2)";  // FROZEN: DO NOT LOCALIZE/CHANGE!
    var kCameraCompCommentMarkerFormat = "[VR-CamComp@1]"       // FROZEN: DO NOT LOCALIZE/CHANGE! 
    var kCameraCompNameSuffixFormatLocalize = localize("$$$/AE/Script/VR/CameraCompNameFormat= (cam@1-@2)");
    var kCameraCompNamesSuffixOriginalEnglishA = [];  // indexed by face, base-0
    var kCameraCompNamesSuffixLocalizeA = [];
    var kCameraCompCommentMarkerA = [];

//    var camLayerName = "SkyBox Camera" + " " + cam_comp_i + " " + "(" + kCameraNamesPostfixOriginalEnglish[cam_comp_i - 1] + ")"; 
    var kCameraLayerNameFormatOriginalEnglish = "SkyBox Camera @1 (@2)";  // FROZEN: DO NOT LOCALIZE/CHANGE!
    var kCameraLayerCommentMarkerFormat = "[VR-CamLayer@1]"       // FROZEN: DO NOT LOCALIZE/CHANGE! 
    var kCameraLayerNameFormatLocalize = localize("$$$/AE/Script/VR/CameraLayerNameFormat=VR Camera @1 (@2)");
    var kCameraLayerNamesOriginalEnglishA = [];  // indexed by face, base-0
    var kCameraLayerNamesLocalizeA = [];
    var kCameraLayerCommentMarkerA = [];  // FUTURE not actually needed?
  
    // precalc original, localize, markers per face:
    var kFaceLayerNamesOriginalEnglishA = [];  // indexed by face, base-0
    var kFaceLayerNamesLocalizeA = [];
    var kFaceLayerCommentMarkerA = [];
    for (var face_i = 1; face_i <= 6; face_i++) {
        var camNamePostfixOriginalEnglish = kCameraNamesPostfixOriginalEnglish[face_i - 1];
        var camNamePostfixLocalize = kCameraNamesPostfixLocalize[face_i - 1];

		// Extract Face layer names
        var orig_eng = kFaceLayerNameFormatOriginalEnglish.replace('@1', face_i).replace('@2', camNamePostfixOriginalEnglish);
        kFaceLayerNamesOriginalEnglishA.push(orig_eng);

        var local = kFaceLayerNameFormatLocalize.replace('@1', face_i).replace('@2', camNamePostfixLocalize);
        kFaceLayerNamesLocalizeA.push(local);

        var marker = kFaceLayerCommentMarkerFormat.replace('@1', face_i);
        kFaceLayerCommentMarkerA.push(marker);

      // Camera comp names
        orig_eng = kCameraCompNameSuffixFormatOriginalEnglish.replace('@1', face_i).replace('@2', camNamePostfixOriginalEnglish);
        kCameraCompNamesSuffixOriginalEnglishA.push(orig_eng);

        local = kCameraCompNameSuffixFormatLocalize.replace('@1', face_i).replace('@2', camNamePostfixLocalize);
        kCameraCompNamesSuffixLocalizeA.push(local);

        marker = kCameraCompCommentMarkerFormat.replace('@1', face_i);
        kCameraCompCommentMarkerA.push(marker);

        // Camera layer names
        orig_eng = kCameraLayerNameFormatOriginalEnglish.replace('@1', face_i).replace('@2', camNamePostfixOriginalEnglish);
        kCameraLayerNamesOriginalEnglishA.push(orig_eng);

        local = kCameraLayerNameFormatLocalize.replace('@1', face_i).replace('@2', camNamePostfixLocalize);
        kCameraLayerNamesLocalizeA.push(local);

        marker = kCameraLayerCommentMarkerFormat.replace('@1', face_i);
        kCameraLayerCommentMarkerA.push(marker);
    }

    var viewerCameraNameOriginalEnglish = "SkyBox Viewer Camera";   // FROZEN: DO NOT LOCALIZE
    var viewerCameraNameCommentMarker = "[VR-ViewerCam]";           // FROZEN: DO NOT LOCALIZE
    var viewerCameraNameLocalize = localize("$$$/AE/Script/VR/ViewerCamera=VR Viewer Camera");

    var kMasterNullParentNameOriginalEnglish = "SkyBox Master Cam Controller";   // FROZEN: DO NOT LOCALIZE
    var kMasterNullParentNameCommentMarker = "[VR-MasterCamCtrl]";              // FROZEN: DO NOT LOCALIZE
    var kMasterNullParentNameLocalize = localize("$$$/AE/Script/VR/MasterCamController=VR Master Cam Controller");

    // warning: also affects expressions
    var kBlendingAdjustmentLayerNameOriginalEnglish = "SkyBox Edge Blending Controls";   // FROZEN: DO NOT LOCALIZE
    var kBlendingAdjustmentLayerNameCommentMarker = "[VR-EdgeBlend]";              // FROZEN: DO NOT LOCALIZE
    var kBlendingAdjustmentLayerNameLocalize = localize("$$$/AE/Script/VR/BlendingAdjustmentLayer=VR Edge Blending Controls");

    // note: these are Effect names and effects have no comment to assign!
    //FUTURE would need unique tag in the effect name and a search within that for expression reference?
    //but these layers are hidden down inside the blending, so effect index sufficient localization for now
    var kBlendingFeatherControlNameOriginalEnglish = "Edge Blending Feather";  // FROZEN: DO NOT LOCALIZE
    var kBlendingFeatherEffectIndex = 1;  
    var kBlendingFeatherControlNameLocalize = localize("$$$/AE/Script/VR/BlendingFeatherControlName=Edge Blending Feather");
    var kBlendingExpansionControlNameOriginalEnglish = "Edge Blending Expansion";  // FROZEN: DO NOT LOCALIZE
    var kBlendingExpansionEffectIndex = 2;
    var kBlendingExpansionControlNameLocalize = localize("$$$/AE/Script/VR/BlendingExpansionControlName=Edge Blending Expansion");

    var kSupportFolderNameOriginalEnglish = "zSupportPrecomps";   // FROZEN: DO NOT LOCALIZE
    var kSupportFolderNameCommentMarker = "[VR-SupportFolder]";   // FROZEN: DO NOT LOCALIZE
    var kSupportFolderNameLocalize = "_" + localize("$$$/AE/Script/VR/SupportPrecompFolder=VRSupportPrecomps"); // special char is to sort to end in most cases

    // warning: touches expressions!  warning several different viewer variations with different
    // content in layer commnets!
    var kViewerLayerNameOriginalEnglish = "SkyBox Viewer";  // FROZEN: DO NOT LOCALIZE
    var kViewerLayerNameCommentMarker = "[VR-ViewerLayer]";  // FROZEN: DO NOT LOCALIZE
    var kViewerLayerNameLocalize = localize("$$$/AE/Script/VR/ViewerLayerName=VR Viewer");


    // these are used to mark skybox created comps of particular versiosn
    // they also filter whether comps are considered skybox or not!
    // skybox output is used on root folder AND the root comp inside that folder

    // warning: V2 has a special older tagging system in the comment field.  old V1 had nothing
    var kSkyBoxV1OutputNamePostfixOriginalEnglish = "SkyBox Output";      // FROZEN: DO NOT LOCALIZE
    var kSkyBoxV2OutputNamePostfixOriginalEnglish = "SkyBoxV2 Output";    // FROZEN: DO NOT LOCALIZE
    // moving detection to the comment tag via [VR:, [VR2: and the output flag on the output comps themselves
    var kSkyBoxV1OutputNamePostfixLocalize = localize("$$$/AE/Script/VR/CompOutputV1=VR Output");        //   // for back compatible V1 behavior. 
    var kSkyBoxV2OutputNamePostfixLocalize = localize("$$$/AE/Script/VR/CompOutputV2=VR2 Output");;       //     V2 is the default.  
    // for folder name matching, 
    // WARNING: The following are hard coded from the original .dat files!
    var kOutputCompV1PostfixLocalizedA =
        [ "VR Output", "VR-Ausgabe", "Salida de VR",
        "Sortie VR", "Output VR", "VR 出力", "VR 출력 ", "Saída de VR", "Выход VR", "VR 输出"  ];
    
    var kOutputCompV2PostfixLocalizedA =
        [ "VR2 Output", "VR2-Ausgabe", "Salida de VR2", 
        "Sortie VR2", "Output VR2", "VR2 出力", "VR2 출력 ", "Saída de VR2", "Выход VR2", "VR2 输出"  ];
  
    // warning: these have a special tagging system in the comment field already
    var kSkyBoxV1EditCompNamePostfixOriginalEnglish = "SkyBox Edit";          // FROZEN: DO NOT LOCALIZE   
    var kSkyBoxV2EditCompNamePostfixOriginalEnglish = "SkyBoxV2 Edit";        // FROZEN: DO NOT LOCALIZE   
    var kSkyBoxV1EditCompNamePostfixLocalize = localize("$$$/AE/Script/VR/CompEditV1=VR Edit");    
    var kSkyBoxV2EditCompNamePostfixLocalize = localize("$$$/AE/Script/VR/CompEditV2=VR2 Edit");    // warning: translations can end up with 2 at the end!


    var kSkyBoxV1ViewerCompNamePostfixOriginalEnglish = "SkyBox Preview";                           // FROZEN: DO NOT LOCALIZE
    var kSkyBoxV1ViewerCompCommentMarker = "[VR-Viewer]";                                       // FROZEN: DO NOT LOCALIZE
    var kSkyBoxV1ViewerCompNamePostfixLocalize = localize("$$$/AE/Script/VR/ViewerComp=VR Preview");
   
    // The V2 precomp was only one original english string, but used in two unique
    // different ways which are now made more explicit.  Originally:
    // 1. "combined" precomp of the form:    title + " (SkyBoxV2 PrecompCombined)"  
    //          replace with localizable:    title + " (VR PrecompCombined)"   +   Comment marker  "[VR-PreCombined]"
    // 2. "edit#" precomp(s) of the form:    title + " (SkyBoxV2 Precomp#)"     
    //          replace with localizable:    title + " (VR Precomp#)"           +   Comment marker  "[VR-PreEdit]"
    //          the index number is NOT part of the marker but needs to be isolatable easily regardless of localization, so position cannot change
    // Note V1 had no specific precomp case
    var kSkyBoxPrecompNamePostfixOriginalEnglish = "SkyBoxV2 Precomp";  // FROZEN: DO NOT LOCALIZE --Legacy search for BOTH (SkyboxV2 PrecompCombined) and (SkyboxV2 Precomp#) cases
    var kSkyBoxPrecompCombinedPostfixOriginalEnglish = " (SkyBoxV2 PrecompCombined)";     // FROZEN: DO NOT LOCALIZE
    var kSkyBoxPrecompCombinedCommentMarker = "[VR-PreCombined]";                         // FROZEN: DO NOT LOCALIZE
    var kSkyBoxPrecompCombinedPostfixLocalize = localize("$$$/AE/Script/VR/V2PrecompCombined=VR PrecompCombined"); //Full format is " (VR PrecompCombined)"

    var kSkyBoxPrecompEditFormatOriginalEnglish = " (SkyBoxV2 Precomp@1)";     // FROZEN: DO NOT LOCALIZE
    var kSkyBoxPrecompEditCommentMarker = "[VR-PreEdit]";                       // FROZEN: DO NOT LOCALIZE   Note does NOT include index
    var kSkyBoxPrecompEditLocalize = localize("$$$/AE/Script/VR/V2PrecompEdit=VR Precomp");  //Full format is " (VR Precomp#)" for index. Can't change index order! 

    var kConversionCompNamePostfixOriginalEnglish = "conversion";    // FROZEN: DO NOT LOCALIZE
    var kConversionCompNameCommentMarker = "[VR-ConversionComp]";    // FROZEN: DO NOT LOCALIZE
    var kConversionCompNameLocalize = localize("$$$/AE/Script/VR/ConversionComp=conversion");

    //////////

    var kCombinedCompNamePostfixOriginalEnglish = "combined";    // FROZEN: DO NOT LOCALIZE
    var kCombinedCompNameCommentMarker = "[VR-CombinedComp]";    // FROZEN: DO NOT LOCALIZE
    var kCombinedCompNameLocalize = localize("$$$/AE/Script/VR/CombinedComp=combined");

    // So this was rather a mess.
    // Some converter layers use the layer tag system, some don't
    // Moving toward using the same name/tagging on both and upgrading to 
    // tagging for new ones in all cases.
    // conversion layers in V2 use the tag system?
    // there are different places where the same string is used
    var kConverterLayerNameOriginalEnglish = "SkyBox Conversion";  // FROZEN: DO NOT LOCALIZE
    var kConverterLayerNameCommentMarker = "[VR-ConversionLayer]";  // FROZEN: DO NOT LOCALIZE
    var kConverterLayerNameLocalize = localize("$$$/AE/Script/VR/ConversionLayer=VR Conversion");

    // recognized names for the 3D Tracker camera.  
    //FUTURE better way: make the tracker tag the layer in a language independent way?  "3D" + Camera layer?
    //New languages won't automatically be reflected here
    var kAdobeTrackerCameraNameA = [
        "3D-Tracker-Kamera", "Cámara de rastreador 3D", "Caméra de suivi 3D",
        "Videocamera tracciatore 3D", "3D トラッカーカメラ", "3D 추적기 카메라",
        "Câmera do controlador 3D", "3D Tracker Camera", "3D 跟踪器摄像机"
    ]

    // relate to skybox2 tags not visible to user. 
    //
    var kSkyBoxTagPrefixSlot1_Original = "SKYBOX";  // FROZEN: DO NOT LOCALIZE
    var kSkyBoxTagPrefixSlot1_v1 = "[VR";     // FROZEN: DO NOT LOCALIZE   original english had NO tag in this case/empty comment. but need to distinguish
    var kSkyBoxTagPrefixSlot1_v2 = "[VR2";     // FROZEN: DO NOT LOCALIZE   this used to be "SKYBOX" in old projects but looks like it wasn't actually checked
    var kSkyBoxTagPrefixSlot2 = localize("$$$/AE/Script/VR/DoNotEdit=DO NOT EDIT");   // not parsed so can be safely localized.  FUTURE other tags should be similar?
    var kSkyBoxTagPrefixSlotEnd = "]";   // FROZEN: DO NOT LOCALIZE.  Making this match other tag structure and allow detect of end
       
    ///// <<<<<  LOCALIZE WITH EXTREME CAUTION 
    

    /////// THESE SAFELY LOCALIZABLE STRINGS USED MULTIPLE TIMES (SO NOT DOING INLINE) >>>>>>>>>>
    var kBlankSkyBoxMasterPrefix = localize("$$$/AE/Script/VR/VRMasterDefaultCompName=VR Master");  // note: was "SkyBox Master"
    var kGenerateSkyBoxButtonLabel = localize("$$$/AE/Script/VR/GenerateSkyBoxOutput=Generate VR Output");
    var kExtractSkyBoxButtonLabel = localize("$$$/AE/Script/VR/ExtractSkyBox=Extract Cubemap");
    var kRefreshSkyBoxButtonLabel = localize("$$$/AE/Script/VR/RefreshSkyBoxOutput=Refresh VR Output");
    var kPoplistNoneChoiceStr = localize("$$$/AE/Script/VR/PoplistNoneChoice=<None>");
    var kAdvancedSettingsStr = localize("$$$/AE/Script/VR/AdvSettings=Advanced Settings");
    var kIAmUsing3DPlugStr = localize("$$$/AE/Script/VR/Using3DPlug=I am using 3D plugins");
    var kUseEdgeBlendStr = localize("$$$/AE/Script/VR/EdgeBlend=Use edge blending");
    var kCameraSettingsStr = localize("$$$/AE/Script/VR/CamSettings=Camera Settings");
    var kUse2NodeCamStr = localize("$$$/AE/Script/VR/Use2nodeCam=Use 2-node camera");
    var kUse3DNullCamCtrlStr = localize("$$$/AE/Script/VR/Use3DNullCamControl=Use 3D null camera control");
    var kCenterCameraStr = localize("$$$/AE/Script/VR/CenterCam=Center camera");
    var kSelectComp360FootStr = localize("$$$/AE/Script/VR/SelectComp360Foot=Select a composition with 360 footage:");
    var kPleaseSelectCompToProcess = localize("$$$/AE/Script/VR/SelectCompAlert=Please select a composition to process.");
    var kSourceFootHasAlpha = localize("$$$/AE/Script/VR/SrcHasAlpha2=Source footage has alpha");
    var kCompositionSettingsStr = localize("$$$/AE/Script/VR/CompSettings3=Composition Settings");
    var kCancelStr = localize("$$$/AE/Script/VR/Cancel=Cancel");
    var kDurationStr = localize("$$$/AE/Script/VR/Duration=Duration")
    //////  <<<<<<<<<<<<<<

    var kPI = 3.14159265358979323;
    var kOneMinusTan40 = 0.16090036882; // (1 - tan(40))
    var kTan50 = 1.19175359259; // tan(50)

    var kScriptsPath = ( script_type==METTLE_SCRIPT_TYPE.COMPOSER ? (new File($.filename)).parent.parent.fsName : (new File($.filename)).parent.fsName ); 

    var skyboxPanel;
    var timeOfLastDynamicControlsUpdate = 0; // need this time guard because Activation event is invoked too many times which causes updateDynamicControls() to be called recuresively in an infinite loop
    var previousCompSelectorIndex = -1;
    
    var skyboxOutputComps = [];

    /* FUNCTIONS */

    function osName()
    {
        var os = system.osName;
        if (!os.length) os = $.os;
        
        return os;
    }

    function setTransformRotationByFaceIndex(trans, face_i) {
        var camera_rotation_angles = [0, 90, 180, 270, 90, 270];

        // all rots around y except top/bottom which are rot around x
        if (face_i < 5) {
            trans.yRotation.setValue(camera_rotation_angles[face_i - 1]);
        } else {
            trans.xRotation.setValue(camera_rotation_angles[face_i - 1]);
        }
    }

    // The output and edit comps can have multiple params in the comment field
    function compTagFromProperties(isOutputComp, isEditComp, userGivenName, isThreeD, useThreeDPlugins, useEdgeBlending, useTwoNodeCamera, useNullParent, centerCamera, reorientCamera, srcHasAlpha)
    {
        var kVRTagVersionSlot1 = (script_type == METTLE_SCRIPT_TYPE.COMPOSER ? kSkyBoxTagPrefixSlot1_v2 : kSkyBoxTagPrefixSlot1_v1);
        var tagArray = [kVRTagVersionSlot1, kSkyBoxTagPrefixSlot2, (isOutputComp | 0), (isEditComp | 0), userGivenName, (isThreeD | 0), (useThreeDPlugins | 0), (useEdgeBlending | 0), (useTwoNodeCamera | 0), (useNullParent | 0), (centerCamera | 0), (reorientCamera | 0), (srcHasAlpha | 0)];
        var tag = tagArray.join(":") + kSkyBoxTagPrefixSlotEnd;
        return tag;
    }

    // The output and edit comps can have multiple params in the comment field
    function compPropertiesFromTag(tag)
    {
        var tagArray = tag.split(":");
        
        var properties = {};
        // tag 0 may be old  SKYBOX, or VR, or VR2    ignored for parse--except special cases
        properties.version = tagArray[0];
        // tag 1 is DO NOT EDIT or some variant thereof.  ignored
        properties.isOutputComp = (tagArray[2] | 0);
        properties.isEditComp = (tagArray[3] | 0);
        properties.userGivenName = tagArray[4];
        properties.isThreeD = (tagArray[5] | 0);
        properties.useThreeDPlugins = (tagArray[6] | 0);
        properties.useEdgeBlending = (tagArray[7] | 0);
        properties.useTwoNodeCamera = (tagArray[8] | 0); 
        properties.useNullParent = (tagArray[9] | 0); 
        properties.centerCamera = (tagArray[10] | 0);
        properties.reorientCamera = (tagArray[11] | 0);
        properties.srcHasAlpha = (tagArray[12] | 0);
        
        return properties;
    }

    /////////////////////////////////////// Output comps

    function compNameWithPostfix(compName, postfix) {
        return compName + " (" + postfix + ")";
    }

    // this is now the LOCALIZED name and type should NOT be relied on for output match
    // the grandfathered case is tested via outputCompNameFromNameOriginalEnglish()
    // except in the grandfathered case.  It should be used for DISPLAY ONLY, not for identity
    // new method should use (master) comp name w/o postfix + the comment tag for identity
    function outputCompNameFromNameLocalizeVersionAware(compName) {
        return compName + " (" + (script_type == METTLE_SCRIPT_TYPE.COMPOSER ? kSkyBoxV2OutputNamePostfixLocalize : kSkyBoxV1OutputNamePostfixLocalize) + ")";
    }

    // if we need the original english output name for legacy matching
    function outputCompNameFromNameOriginalEnglish(compName) {
        return compName + " (" + (script_type == METTLE_SCRIPT_TYPE.COMPOSER ? kSkyBoxV2OutputNamePostfixOriginalEnglish : kSkyBoxV1OutputNamePostfixOriginalEnglish) + ")";
    }

    // if no comment, check the grandfathered english names
    // otherwise..
    // check just the specific output flag
    // NOTE: this matches regardless of tag version stamp or whether this is a grandfathered skybox tag format
    function isAnyOutputCompVariant(comp)
    {
        if (comp.comment == "") {
            // no tag grandfathered case
            if (comp.name.indexOf(kSkyBoxV2OutputNamePostfixOriginalEnglish) > 0) return true;
            if (comp.name.indexOf(kSkyBoxV1OutputNamePostfixOriginalEnglish) > 0) return true;
            return false;
        }

        // ok, may be new style or V2 old style, check tag flag:
        var tagArray = comp.comment.split(":");
        var isOutputComp = (tagArray[2] | 0);   //must match compPropertiesFromTag etc.
        return isOutputComp;
    }

    // is output comp of V1 or V2 type (aware of matching context)
    function isMatchOutputCompVersionAware(targname, comp)
    {
        // if no comment, does the original output english variant (version corrected) match?
        if (comp.comment == "") {
            return  (outputCompNameFromNameOriginalEnglish(targname) == comp.name);
        }

        // otherwise, has comment, so may be new style or V2 old style, do the names match without postfix?
        if (nameWithoutLastParenBlock(comp.name) != targname) return false;

        // ok, the name is right, is this actually an output comp tag of the right version?
        var tagArray = comp.comment.split(":");
        var compType = tagArray[0]; // e.g. old SKYBOX (V2), VR (V1), or VR2 (V2)
        var isOutputComp = (tagArray[2] | 0);   //must match above
        if (!isOutputComp) return false;        // not an output comp

        if (script_type == METTLE_SCRIPT_TYPE.COMPOSER)
        {
            // must match of V2 cases (old or new) for composer use
            return ( compType == kSkyBoxTagPrefixSlot1_Original || compType == kSkyBoxTagPrefixSlot1_v2 );
        } 

        // must be the new V1 tag .. only possibility left
        return compType == kSkyBoxTagPrefixSlot1_v1;
    }


    /////////////////////////////////////// Edit comps

    // if no comment, check the grandfathered english names
    // otherwise..
    // check just the specific output flag
    // NOTE: this matches regardless of tag version stamp or whether this is a grandfathered skybox tag format
    function isAnyEditCompVariant(comp)
    {
        if (comp.comment == "") {
            // no tag grandfathered case
            if (comp.name.indexOf(kSkyBoxV2EditCompNamePostfixOriginalEnglish) > 0) return true;
            if (comp.name.indexOf(kSkyBoxV1EditCompNamePostfixOriginalEnglish) > 0) return true;
            return false;
        }

        // ok, may be new style or V2 old style, check tag flag:
        var tagArray = comp.comment.split(":");
        var isEditComp = (tagArray[3] | 0);   //must match compPropertiesFromTag etc.
        return isEditComp;
    }

    //////

    var kSkyboxVersionV1 = 1;
    var kSkyboxVersionV2 = 2;

    function isEditCompMatch(comp, targname, skyver, editidx) {
        // if no comment, does the original V1 english variant (version corrected) match?
        // if comment, and substr name match,  and is output comp flag and correct version (grandfathered V2, new V1 or V2).. match
        if (skyver == kSkyboxVersionV1) {
            // the old V1 case
            if (comp.comment == "") {
                return ((targname + " (" + kSkyBoxV1EditCompNamePostfixOriginalEnglish + ")") == comp.name);
            }

            // new V1 tag case
            var tagArray = comp.comment.split(":");
            var compType = tagArray[0]; // e.g. old SKYBOX (V2), VR (V1), or VR2 (V2)
            var isEditComp = (tagArray[3] | 0);   //must match tag geenration parsing
            return isEditComp && (compType == kSkyBoxTagPrefixSlot1_v1);
        }

        // must be a V2 request now. We expect comment, may be new style or V2 old style, do the names match without postfix?
        if (nameWithoutLastParenBlock(comp.name) != targname) return false;

        // the edit index must match
        if (getIndexPostfixForEditName(comp.name) != editidx) return false;

        // ok, the name/idx is right, is this actually an edit comp tag of the right version?
        var tagArray = comp.comment.split(":");
        var compType = tagArray[0]; // e.g. old SKYBOX (V2), VR (V1), or VR2 (V2)
        var isEditComp = (tagArray[3] | 0);   //must match tag geenration parsing
        if (!isEditComp) return false;        // not an edit comp

        // unexpected tag markings?
        return (compType == kSkyBoxTagPrefixSlot1_Original || compType == kSkyBoxTagPrefixSlot1_v2);
    }

    // find a partiular edit comp.  version2 requires and editindex
    function findEditCompWithinItemCollection(compRootName, skyver, editidx, itemCollection) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof CompItem && isEditCompMatch(curItem, compRootName, skyver, editidx)) return curItem;
        }

    }

    /////////////////////////////////////// Layer tags

    // used by comment on output converter layer and the precomp viewer layer
    function layerTagFromProperties(isViewerLayer, isConverterLayer)
    {
        // version variation not used right now, but may be useful to know later
        var kVRTagVersionSlot1 = (script_type == METTLE_SCRIPT_TYPE.COMPOSER ? kSkyBoxTagPrefixSlot1_v2 : kSkyBoxTagPrefixSlot1_v1);
        var tagArray = [kVRTagVersionSlot1, kSkyBoxTagPrefixSlot2, (isViewerLayer | 0), (isConverterLayer | 0)];
        var tag = tagArray.join(":") + kSkyBoxTagPrefixSlotEnd;
        return tag;
    }

    function layerPropertiesFromTag(tag)
    {
        var tagArray = tag.split(":");
        
        var properties = {};
        // SKYBOX:DO NOT EDIT etc. ignored
        properties.isViewerLayer = (tagArray[2] | 0);
        properties.isConverterLayer = (tagArray[3] | 0);
        
        return properties;
    }



    function nextUniqueEditCompIndexFromName(compName)
    {
         var editCompName = "";
         var editComp = null;
         var foundEditIdx = 0;      

        var itemCollection = app.project.items;
        for (var i = 1; i <= itemCollection.length; i++) {
             // looking for highest index number that doesn't match the old English name format
             // and isn't a modern edit comp with the same index number (regardless of translation)
             // (highest unique index number within the comp folder tree.. the index number needs to be
             // unique because of use on precomps etc.)
             // 
            editComp = itemCollection[i];
            var editidx =getIndexPostfixForEditName(editComp.name);  // we don't know if this is an edit idx yet, but reusable..
            
           // orignial english edit comp? strip off final paren and index
           // once we have the index, that should be the ENTIRE name, no following blocks
            engCompName = compName + " (" + kSkyBoxV2EditCompNamePostfixOriginalEnglish + editidx + ")";  // match w/o index
            if (editComp.name == engCompName)  {
                if (editidx > foundEditIdx) foundEditIdx = editidx;
                continue;
            }
        
            // new tagged edit comp with matching name?
            var compProperties = compPropertiesFromTag(editComp.comment);
            if (compProperties.isEditComp && nameWithoutLastParenBlock(editComp.name) == compName)    // localization independent test for edit comp, and we shouldn't have V1 content here
            {
                if (editidx > foundEditIdx) foundEditIdx = editidx;
                continue;
             }
         }
     
         // ok, one higher than the highest found.  That should be unique
         foundEditIdx++;
        
        return foundEditIdx;
    }

    function nextUniqueMasterCompName()
    {
        var masterCompName = "";
        var masterComp = null;
        var masterCompIndex = 0;      
        do
        {
        masterCompIndex++;
        masterCompName = kBlankSkyBoxMasterPrefix + (masterCompIndex>1?" "+masterCompIndex:""); 
        var outputCompName = outputCompNameFromNameLocalizeVersionAware(masterCompName);    // localized ok for new unique name
        masterComp = itemByNameWithinItemCollection(outputCompName, "CompItem", app.project.items);
        }
        while (masterComp!=null);
        
        return masterCompName;
    }

    function defaultUserGivenName(editCompIndex, threeDMode)
    {
        return localize("$$$/AE/Script/VR/UserGivenEditDefault=Edit") + " " + editCompIndex + (threeDMode ? " (3D)" : ""); 
    }

    // Important: the exact name is NOT searched for, but the marker is NOT sufficient in this case! Special case!
    // search for the user portion of the comp name + the marker for the modern case
    // There is also an old english variant of this format!
    function viewerCompNameFromNameLocalized(compName)
    {
        return compName + " (" + kSkyBoxV1ViewerCompNamePostfixLocalize + ")";
    }

    // this is the opposite operation from the concatenate  comp name + " ("  ")"
    // locate that last paren block including the leading space and return just the name
    // THIS MAY NOT BE UNIQUE without combining with other type information like the comment tag
    // but it allows the paren block to be localized
    // THIS PRESUMES PAREN IS CONSTANT ACROSS LANGUAGES
    function nameWithoutLastParenBlock(fullNameWithBlock) {
        var lastOpenParen = fullNameWithBlock.lastIndexOf(" (");
        if (lastOpenParen >= 0)
            return fullNameWithBlock.substring(0, lastOpenParen);
        return "";   // no block found..don't match
    }

    function combinedCompNameFromNameLocal(compName)
    {
        return compName + " (" + kCombinedCompNameLocalize + ")"; 
    }

    function generatorOutputCompNameForEditCompName(compName)
    {
        return compName + " (3D)";    // FUTURE Note: ignoring this one for localization because loc doesn't translate this
    }

    // given a comp (assumed master), locate an output comp with the same name in the project
    // the problem is we shouldn't rely on the postfix anymore
    function findOutputCompForMasterComp(comp, itemCollection) 
    {
        if(comp==null) return null;
        return findOutputCompForMasterCompName(comp.name, itemCollection);
    }

    function findOutputCompForMasterCompName(masterName, itemCollection)
    {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof CompItem && isMatchOutputCompVersionAware(masterName, curItem)) return curItem;
        }
        
        return null;
    }



  

    ////////

    // presuming an output comp, locate the comp that if turned into an output comp name matches this one
    // we do that by stripping off the output postfix.  
    // Note: this means the master could have different kinds of output comps and that is OK yes?
    function findMasterCompForOutputComp(outComp)
    {
        var outNameWithoutLastParenBlock = nameWithoutLastParenBlock(outComp.name);
        for(var i=1; i<=app.project.numItems; i++)
        {
            var curItem = app.project.item(i);
            if(!(curItem instanceof CompItem)) continue;
            
            if(curItem.name == outNameWithoutLastParenBlock)
                return curItem;
        }

        return null;
    }

    function findOutputFolderByNameLocalizeAware(outCompName)
    {
        var verList = (script_type == METTLE_SCRIPT_TYPE.COMPOSER) ? kOutputCompV2PostfixLocalizedA : kOutputCompV1PostfixLocalizedA;
        var itemCollection = app.project.items;
        for (var iColl = 1; iColl <= itemCollection.length; iColl++) {
            var curItem = itemCollection[iColl];
            if (curItem instanceof FolderItem) {
                // try every language variation of the possible output to match
                for (var iLang = 0; iLang < verList.length ; iLang++) {
                    var localOutCompName = outCompName + " (" + verList[iLang] + ")";
                    if (curItem.name == localOutCompName) return curItem;    
                }

                // if that still didn't work try the grandfathered English names, version aware
                if (curItem.name == outputCompNameFromNameOriginalEnglish(outCompName)) return curItem;
            }
 
        }

        return null;
    }

    function indexOfElementInArray(elem, arr)
    {
        for(var i=0; i<arr.length; i++)
            if(arr[i]==elem) return i;
            
        return -1;
    }

    function activeCompItem()
    {
        var activeComp = app.project.activeItem;
        if(activeComp instanceof CompItem) return activeComp;
        
        return null;
    }

    function selectedCompItem(ui)
    {
        if(ui!=null)
        {
            var selectedComp = ( ui.comp_selector.selection!=null ? itemByNameWithinItemCollection(ui.comp_selector.selection.text, "CompItem", app.project.items)  : null );
            previousCompSelectorIndex = ui.comp_selector.selection.index;
            
            return selectedComp;
        }
            
        var selection = app.project.selection;
        if(selection==null) return null;
        
        var firstSelectedItem = selection[0];
        if(!(firstSelectedItem instanceof CompItem)) return null;
        
        return firstSelectedItem;
    }

    function compSelectorIndex(compNames)
    {
        if(previousCompSelectorIndex==-1) // on the very first launch select what's selected on the UI
        {
            var selection = app.project.selection;
            if(selection==null) return 0;
            
            var firstSelectedItem = selection[0];
            if(!(firstSelectedItem instanceof CompItem)) return 0;
            
            var indexInArray = indexOfElementInArray(firstSelectedItem.name, compNames);
            if(indexInArray == -1) return 0;
            
            return indexInArray;
        }
        
        return (previousCompSelectorIndex < compNames.length ? previousCompSelectorIndex : 0);
    }

    // strip a collection down to the comps, possibly excluding skybox generated content (e.g. trolling for masters)
    function allCompsWithinItemCollection(itemCollection, excludeSkyBox)
    {
        var compList = [];
        for(var i=1; i<=itemCollection.length; i++)
        {
            var curItem = itemCollection[i];
            if(curItem instanceof CompItem) 
            {
                if(excludeSkyBox)
                {
                    // WARNING: the presence of the postfix might be existing behavior, but nesting/duping comps could cause that to fail..?
                    if (isAnyOutputCompVariant(curItem)) continue;
                    if (isAnyEditCompVariant(curItem)) continue;
                    if(curItem.comment == "" && curItem.name.indexOf(kSkyBoxPrecompNamePostfixOriginalEnglish) > 0)  continue;     
                    
                    // WARNING: the presence of the postfix might be existing behavior, but nesting/duping comps could cause that to fail..?
                    if (curItem.comment == "" && curItem.name.indexOf(kSkyBoxV1ViewerCompNamePostfixOriginalEnglish) > 0 ) continue;

                    if (curItem.comment.indexOf("[VR") >= 0) continue;  // skip ANY tag marked comp to catch remaining cases
                }
                
                // survived.. keep it
                compList.push(curItem);
            }
        }

        return compList;
    }
    
    // all comp names in collection, possibly add zero element name (e.g. poplist)
    function allCompNamesWithinItemCollection(itemCollection, excludeSkyBox, zeroElementName)
    {
        var compList = allCompsWithinItemCollection(itemCollection, excludeSkyBox);
        var compNames = [zeroElementName];
        for (var i = 0; i < compList.length; i++) {
            compNames.push(compList[i].name);
        }
        return compNames;
     }
 
    //FIXME is this going to work as expected?
    function allCompNamesOfImplicitSkyBoxMasters()
    {
        var compNames = [];

        for(var i=0; i<skyboxOutputComps.length; i++)
        {
           var masterComp = itemByNameWithinItemCollection(skyboxOutputComps[i].skyboxTitle, "CompItem", app.project.items);
           if(masterComp==null) compNames.push(skyboxOutputComps[i].skyboxTitle);
        }

        return compNames;
     }

    // used for making master names unique
    function countItemsWithPrefix(itemPrefix, itemType, maxLenAfterPrefix)
    {
        var count = 0;
        for(var i=1; i<=app.project.numItems; i++)
        {
            var curItem = app.project.item(i);
            if( curItem instanceof eval(itemType) && curItem.name.indexOf(itemPrefix)==0 && curItem.name.length<=itemPrefix.length+maxLenAfterPrefix ) 
                count++;
        }

        return count;
    }

    // WARNING: USING THIS FUNCTION MAY NOT BE WHAT YOU WANT!
    // ...if there is a localized portion of the name it may not match an existing item from another language
    function itemByNameWithinItemCollection(itemName, itemType, itemCollection) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof eval(itemType) && curItem.name == itemName) return curItem;
        }

        return null;
    }

    //////


    function isCameraComp(comp, outputName, face_i) {
        // original behavior: camera comps in V1 were found by comp name and had blank comment
        //   OR they might have an old irrelevant SKYBOX tag b/c copied from some output/edit comp which will get overriden shortly
        //   but that situation may still exist briefly while this is being found for processing
        // new behavior  camera comps are found by user portion of comp name +  VR-CamComp# tag by iteself indicating index, no settings
        //   there are no settings, and the same VR-CamComp# marker is used in both V1 and V2 trees

        if (comp.comment.indexOf(kCameraCompCommentMarkerA[face_i - 1]) >= 0) {
            // this is the matching type, but does it start with the right user provided comp name?
            // only checking the prefix, not the suffix, because it could be from another language
            // but this leaves us exposed to the possibility of multiple comps with nesting user names false matching.
            // so strip off the final parenthetical, then the name should exact match
            // but that could vary across languages, so we need to check every possible parenthetical after translation IF ever different
            return nameWithoutLastParenBlock(comp.name) == outputName;   // Expect exact match for the user name w/o the localized suffix
        } else {
            // might still be the old style cam comp where the cam/idx is in the comp name   (and comment is blank)
            // OR  temporary old SKYBOX tag from an Edit# comp clone we are about to obliterate could be present too
            var old_english_comp_name = outputName + kCameraCompNamesSuffixOriginalEnglishA[face_i - 1];
            if (comp.name != old_english_comp_name) return false;   // not the droid we are looking for

            // either matches the expected old camcomp tagging variations, or we don't know what the heck this is
            var old_v1_camcompB = (comp.comment == "");
            var old_v2_clone_camcompB = comp.comment.indexOf(kSkyBoxTagPrefixSlot1_Original >= 0);  // stale cloned irrelevant tag
            return old_v1_camcompB || old_v2_clone_camcompB;
        }
    }

    function findCameraCompWithinItemCollection(outputName, itemCollection, face_i) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof CompItem && isCameraComp(curItem, outputName, face_i)) return curItem;
        }

        return null;
    }

    ///////

    function isViewerComp(comp, outputName) {
        // either this is a modern localized viewer comp  (located by user portion of name + comment tag for identity)
        // or this is an old un-loclalized viewer comp (located by user portion of name + english untranslated part of name)
        if (comp.comment.indexOf(kSkyBoxV1ViewerCompCommentMarker) >= 0) {
            // this is the matching type, but does it start with the right user provided comp name?
            // only checking the prefix, not the suffix, because it could be from another language
            // but this leaves us exposed to the possibility of multiple comps with nesting user names false matching.
            // so strip off the final parenthetical, then the name should exact match
            // but that could vary across languages, so we need to check every possible parenthetical after translation IF ever different
            return nameWithoutLastParenBlock(comp.name) == outputName;   // Expect exact match for the user name w/o the localized suffix
        } else {
            // might still be the old style comp name. must match viewerCompname localized format
            var old_english_comp_name = outputName + " (" + kSkyBoxV1ViewerCompNamePostfixOriginalEnglish + ")";
            return comp.comment == "" && comp.name == old_english_comp_name;
        }
    }

    function findViewerCompWithinItemCollection(outputName, itemCollection) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof CompItem && isViewerComp(curItem, outputName)) return curItem;
        }

        return null;
    }


    //////

    function isPrecompCombined(comp, skyboxTitle) {
        // either this is a modern localized viewer comp  (located by user portion of name + comment tag for identity)
        // or this is an old un-loclalized viewer comp (located by user portion of name + english untranslated part of name)
        if (comp.comment.indexOf(kSkyBoxPrecompCombinedCommentMarker) >= 0) {
            // this is the matching type, but does it start with the right user provided comp name?
            // only checking the prefix, not the suffix, because it could be from another language
            // but this leaves us exposed to the possibility of multiple comps with nesting user names false matching.
            // so strip off the final parenthetical, then the name should exact match
            // but that could vary across languages, so we need to check every possible parenthetical after translation IF ever different
            return nameWithoutLastParenBlock(comp.name) == skyboxTitle;   // Expect exact match for the user name w/o the localized suffix (replaced by marker)
        } else {
            // might still be the old style english comp name.
            var old_english_comp_name = skyboxTitle + kSkyBoxPrecompCombinedPostfixOriginalEnglish;
            return comp.comment == "" && comp.name == old_english_comp_name;
        }
    }

    function findPrecompCombinedWithinItemCollection(skyboxTitle, itemCollection) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof CompItem && isPrecompCombined(curItem, skyboxTitle)) return curItem;
        }

        return null;
    }



    // TRICKY! this matches on the user name as-is UP TO the localized string, and then matches on the index portion AFTER the localized string
    function isPrecompEdit(comp, skyboxTitle, editIdx) {
        // either this is a modern localized viewer comp  (located by user portion of name + comment tag for identity)
        // or this is an old un-loclalized viewer comp (located by user portion of name + english untranslated part of name)
        if (comp.comment.indexOf(kSkyBoxPrecompEditCommentMarker) >= 0) {
            // this is the matching type, but does it start with the right user provided comp name?
            // only checking the prefix, not the suffix, because it could be from another language
            // but this leaves us exposed to the possibility of multiple comps with nesting user names false matching.
            // so strip off the final parenthetical, then the name should exact match
            // but that could vary across languages, so we need to check every possible parenthetical after translation IF ever different
            return nameWithoutLastParenBlock(comp.name) == skyboxTitle;   // Expect exact match for the user name w/o the localized suffix (replaced by marker)
        } else {
            // might still be the old style english comp name.
            var old_english_comp_name = skyboxTitle + kSkyBoxPrecompEditFormatOriginalEnglish.replace("@1", editIdx);
            return comp.comment == "" && comp.name == old_english_comp_name;
        }
    }

    // locate the last series of digits at the end of the last parn block  e.g.  (Edit1)
    // Nan if bad parse/missing
    function getIndexPostfixForEditName(name)
    {
        // ok, it seems to be an edit. Is this the specific edit we are looking for?
        // find matching editIndex at end of string but before paren   e.g.  "locstring##)"
        // walk back from last paren looking for full number
        var lastCloseParen = name.lastIndexOf(")");
        var startIndex = lastCloseParen;
        var foundidx = NaN;
        while (startIndex-- > 0) {
            var currsubstr = name.substring(startIndex, lastCloseParen);
            var nextidx = parseInt(currsubstr);  // check the previous number
            if (isNaN(nextidx)) break;  // next isn't a number, stop with what we have, if any
            if (foundidx != NaN && currsubstr.substr(0,1) == " ")
                break;  // we found a number and now we've hit a space delimiter. end the number
            foundidx = nextidx;  // what we've found so far
        }
        return foundidx;
    }

    // look for a particular edit index at the end of the last paren block
    // (ignore language differences)  FIXME BEWARE: Ordering of VR2 numbering in localized lang?
    function findPrecompEditWithinItemCollection(skyboxTitle, editIndex, itemCollection) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof CompItem && isPrecompEdit(curItem, skyboxTitle, editIndex)) {
                // ok, it seems to be an edit. Is this the specific edit we are looking for?
                // find matching editIndex at end of string but before paren   e.g.  "locstring##)"
                // walk back from last paren looking for full number
                var foundidx = getIndexPostfixForEditName(curItem.name);
                if (!isNaN(foundidx) && foundidx == editIndex) { return curItem; }  //found and match!
            }
        }

        return null;
    }


    //////
    //////

    function isMasterCameraLayer(layer) {
        // check both new partial marker (none-localized) or pre-Adobe english name
        // NOTE: The original check was looser (>=0), now must exactly match for consistency
        return layer.comment.indexOf(kMasterCameraCommentMarker) >= 0 || layer.name == kMasterCameraNameOriginalEnglish;
    }

    function findMasterCameraWithinItemCollection(itemCollection) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof CameraLayer && isMasterCameraLayer(curItem)) return curItem;
        }

        return null;
    }

  

    //////

    function isConversionComp(selcompname, curItem) {
        // check both new partial marker (none-localized) or pre-Adobe english name
        // NOTE: The original check was looser (>=0), now must exactly match for consistency
        var orig_eng_name = compNameWithPostfix(selcompname, kConversionCompNamePostfixOriginalEnglish);
        return curItem.comment.indexOf(kConversionCompNameCommentMarker) >= 0 || curItem.name == orig_eng_name;
    }

    function findConversionCompWithinItemCollection(selcompname, itemCollection) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof CompItem && isConversionComp(selcompname, curItem)) return curItem;
        }

        return null;
    }

    //////

 
    function isCombinedComp(outputName, curItem) {
        // check both new partial marker (none-localized) or pre-Adobe english name
        // NOTE: The original check was looser (>=0), now must exactly match for consistency
        var orig_eng_name = compNameWithPostfix(outputName, kCombinedCompNamePostfixOriginalEnglish);
        return curItem.comment.indexOf(kCombinedCompNameCommentMarker) >= 0 || curItem.name == orig_eng_name;
    }

    function findCombinedCompWithinItemCollection(outputName, itemCollection) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof CompItem && isCombinedComp(outputName, curItem)) return curItem;
        }

        return null;
    }


    //////

    function isMasterNullParentLayer(layer) {
        // check both new partial marker (none-localized) or pre-Adobe english name
        // NOTE: The original check was looser (>=0), now must exactly match for consistency
        return layer.comment.indexOf(kMasterNullParentNameCommentMarker) >= 0 || layer.name == kMasterNullParentNameOriginalEnglish;
    }

    function findMasterNullParentWithinItemCollection(itemCollection) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof AVLayer && isMasterNullParentLayer(curItem)) return curItem;
        }

        return null;
    }

    /////

    function isSupportFolderItem(item) {
        // check both new partial marker (none-localized) or pre-Adobe english name
        return item.comment.indexOf(kSupportFolderNameCommentMarker) >= 0 || item.name == kSupportFolderNameOriginalEnglish;
    }

    function findSupportFolderWithinItemCollection(folderCollection) {
        for (var i = 1; i <= folderCollection.length; i++) {
            var curItem = folderCollection[i];
            if (curItem instanceof FolderItem && isSupportFolderItem(curItem)) return curItem;
        }

        return null;
    }


    //////

    function isBlendingAdjustmentLayer(layer) {
        // check both new partial marker (none-localized) or pre-Adobe english name
        // NOTE: The original check was looser (>=0), now must exactly match for consistency
        return layer.comment.indexOf(kBlendingAdjustmentLayerNameCommentMarker) >= 0 || layer.name == kBlendingAdjustmentLayerNameOriginalEnglish;
    }

    function findBlendingAdjustmentWithinItemCollection(itemCollection) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof AVLayer && isBlendingAdjustmentLayer(curItem)) return curItem;
        }

        return null;
    }

    //////

    function isViewerCameraLayer(layer) {
        // check both new partial marker (none-localized) or pre-Adobe english name
        // NOTE: The original check was looser (>=0), now must exactly match for consistency
        return layer.comment.indexOf(viewerCameraNameCommentMarker) >= 0 || layer.name == viewerCameraNameOriginalEnglish;
    }

    function findViewerCameraWithinItemCollection(itemCollection) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof CameraLayer && isViewerCameraLayer(curItem)) return curItem;
        }

        return null;
    }

    //////

    // note: this is NOT the precomp layer viewer
    function isViewerLayer(layer) {
        // check both new partial marker (none-localized) or pre-Adobe english name
        // NOTE: The original check was looser (>=0), now must exactly match for consistency
        // WARNING: Is "Original English" enough or needs to look at the old comment tag too?
        return layer.comment.indexOf(kViewerLayerNameCommentMarker) >= 0 ||
           layerPropertiesFromTag(layer.comment).isViewerLayer == 1 ||   // older styles
            layer.name == kViewerLayerNameOriginalEnglish;
    }

    // note: this is NOT the precomp layer viewer
    //FIXME duplicates findViewerLayer?  
    function findViewerLayerNameWithinItemCollection(itemCollection) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof AVLayer && isViewerLayer(curItem)) return curItem;
        }

        return null;
    }


    //////

    function isExtractFaceLayer(layer, face_i) {
        // check both new partial marker (none-localized) or pre-Adobe english name
        return layer.comment.indexOf(kFaceLayerCommentMarkerA[face_i - 1]) >= 0 ||
            layer.name == kFaceLayerNamesOriginalEnglishA[face_i - 1];
    }

    function findExtractFaceLayerWithinItemCollection(face_i, itemCollection) {
        for (var i = 1; i <= itemCollection.length; i++) {
            var curItem = itemCollection[i];
            if (curItem instanceof AVLayer && isExtractFaceLayer(curItem, face_i)) return curItem;
        }

        return null;
    }

    function findViewerLayerInComp(comp)
    {
        for(var layer_i=1; layer_i<=comp.layers.length; layer_i++)
        {
            var curLayer = comp.layers[layer_i];
            if (isViewerLayer(curLayer)) return curLayer;
        }
    
        return null;
    }
  

    function findConverterLayerInComp(comp)
    {
        for(var layer_i=1; layer_i<=comp.layers.length; layer_i++)
        {
            var curLayer = comp.layers[layer_i];

            // the new method is the comment marker..
            if (curLayer.comment.indexOf(kConverterLayerNameCommentMarker) >= 0) return curLayer;

            // but SOME old converter layers had a special SKYBOX tag with flags which was kinda fugly..
            var properties = layerPropertiesFromTag(curLayer.comment);
            if (properties.isConverterLayer == 1) return curLayer;

            // ..and others had no tag a all and looked for the old english name
            if (curLayer.comment == "" && curLayer.name == kConverterLayerNameOriginalEnglish) return curLayer;
        }
    
        return null;
    }

    function findGenericMarkerOldEngInComp(comp, markerStr, oldEngStr) {
        for (var layer_i = 1; layer_i <= comp.layers.length; layer_i++) {
            var curLayer = comp.layers[layer_i];

            // the new method is the comment marker..
            if (curLayer.comment.indexOf(markerStr) >= 0) return curLayer;

            // ..and others had no tag a all and looked for the old english name
            if (curLayer.comment == "" && curLayer.name == oldEngStr) return curLayer;
        }

        return null;
    }


    function deselectAllItems()
    {
        for(var i=1; i<=app.project.numItems; i++)
            if(app.project.item(i).selected)
            app.project.item(i).selected = false;
    }

    function selectComp(comp)
    {
        deselectAllItems();
        comp.selected = true;
    }

    function copyAllLayersBesidesCameras(srcComp, destComp)
    {
        for(var layer_i=1; layer_i<=srcComp.layers.length; layer_i++)
        {
            var curLayer = srcComp.layers[layer_i];
            if(!(curLayer instanceof CameraLayer) && curLayer.parent==null) // avoid copying layers with parent - causes AE crash 
                curLayer.copyToComp(destComp);
        }
        
        return true;
    }
    
    function sortEditCompsByUserGivenName(editComps) {
        var reText = /[^0-9]+/;
        var reNum = /[0-9]+/;
        function sortAlphaNum(a,b) {
            var aTextMatch = a.userGivenName.match(reText);
            var aText = !!aTextMatch ? aTextMatch[0] : "";
            var bTextMatch = b.userGivenName.match(reText);
            var bText = !!bTextMatch ? bTextMatch[0] : "";
            if(aText === bText) {
                var aNumMatch = a.userGivenName.match(reNum);
                var bNumMatch = b.userGivenName.match(reNum);
                //may have no number treat no number as less than zero for consistency
                var aNum = -1;
                if (!!aNumMatch) {
                    aNum = parseInt(aNumMatch[0], 10);
                }
                var bNum = -1;
                if (!!bNumMatch) {
                    bNum = parseInt(bNumMatch[0], 10);
                }

                if(aNum < bNum){
                    return -1;
                }
                else if(aNum > bNum){
                    return 1;
                }
                else{
                    return 0;
                }
            } else {
                return aText > bText ? 1 : -1;
            }
        }

        return editComps.sort(sortAlphaNum);
    }

    /*
    function isTrackerApplied(editComp)
    {
        var viewerLayer = findViewerLayerInComp(editComp);
        if(viewerLayer!=null && viewerLayer.effect.property(kAdobeTrackerMatchName)!=null)
            return true;
            
        return false;
    }
    */


    function updateDynamicControls_Creator()
    {
        /* update the list of comps */
        
        if(skyboxPanel.comp_selector!=null)
            skyboxPanel.remove(skyboxPanel.comp_selector); // can't update list items, so need to recreate each time
            
        var compNames = allCompNamesWithinItemCollection(app.project.items, true, kPoplistNoneChoiceStr);
        skyboxPanel.comp_selector = skyboxPanel.add ("dropdownlist", [13,58,296,78], compNames); 
        skyboxPanel.comp_selector.selection = compSelectorIndex(compNames);
        skyboxPanel.comp_selector.onChange = function()
        {
            /* Update the text on Generate SkyBox button */
            
            var selectedComp = selectedCompItem(this.parent);
            
            var canRefreshSkyBoxForCurrentComp = false;
            if(selectedComp==null) canRefreshSkyBoxForCurrentComp = false;
            else if( findMasterCompForOutputComp (selectedComp)!=null || findOutputCompForMasterComp(selectedComp, app.project.items) !=null) canRefreshSkyBoxForCurrentComp = true;
            skyboxPanel.btnGenerate.text = ( canRefreshSkyBoxForCurrentComp ? kRefreshSkyBoxButtonLabel : kGenerateSkyBoxButtonLabel );
        }

        skyboxPanel.comp_selector.notify("onChange"); // need to call this explicitly because assigning 'selection' property doesn't trig event
        
        /* update availability of dynamic controllers */
        
        skyboxPanel.comp_selector.enabled = skyboxPanel.radio_grp.rb1.value;
        
        skyboxPanel.size_label.enabled = skyboxPanel.radio_grp.rb2.value;
        skyboxPanel.fps_label.enabled = skyboxPanel.radio_grp.rb2.value;
        skyboxPanel.duration_label.enabled = skyboxPanel.radio_grp.rb2.value;

        skyboxPanel.size_input.enabled = skyboxPanel.radio_grp.rb2.value;
        skyboxPanel.fps_input.enabled = skyboxPanel.radio_grp.rb2.value;
        skyboxPanel.duration_input.enabled = skyboxPanel.radio_grp.rb2.value;
        
        skyboxPanel.btnCreateMaster.enabled = skyboxPanel.radio_grp.rb2.value;
    }

    function updateDynamicControls_Extractor()
    {
        /* update the list of comps */
        
        if(skyboxPanel.comp_selector!=null)
            skyboxPanel.remove(skyboxPanel.comp_selector); // can't update list items, so need to recreate each time
            
        var compNames = allCompNamesWithinItemCollection(app.project.items, true, kPoplistNoneChoiceStr);
        skyboxPanel.comp_selector = skyboxPanel.add ("dropdownlist", [13,28,296,48], compNames); 
        skyboxPanel.comp_selector.selection = compSelectorIndex(compNames);
        skyboxPanel.comp_selector.onChange = function()
        {
            /* Update the text on Extract SkyBox button */
            
            var selectedComp = selectedCompItem(this.parent);
            
            var canRefreshSkyBoxForCurrentComp = false;
            if(selectedComp==null) canRefreshSkyBoxForCurrentComp = false;
            else if( findMasterCompForOutputComp (selectedComp)!=null || findOutputCompForMasterComp(selectedComp,app.project.items) !=null) canRefreshSkyBoxForCurrentComp = true;
            skyboxPanel.btnExtract.text = ( canRefreshSkyBoxForCurrentComp ? kRefreshSkyBoxButtonLabel : kExtractSkyBoxButtonLabel );
        }

        skyboxPanel.comp_selector.notify("onChange"); // need to call this explicitly because assigning 'selection' property doesn't trig event
    }

    function updateDynamicControls()
    {
        if(script_type==METTLE_SCRIPT_TYPE.CREATOR) updateDynamicControls_Creator();
        else if(script_type==METTLE_SCRIPT_TYPE.EXTRACTOR) updateDynamicControls_Extractor();
    }

    function createUIControls_Creator()
    {
        //skyboxPanel.add ('image', [5,5,305,65], new File('SkyBox Creator.png'));
        
        skyboxPanel.radio_grp = skyboxPanel.add('panel', [5, 9, 305, 83]);
        skyboxPanel.radio_grp.rb2 = skyboxPanel.radio_grp.add('radiobutton', [6, 2, 295, 20],  localize("$$$/AE/Script/VR/CreateNewMaster=Create New VR Master"));   // REVIEW change
        skyboxPanel.radio_grp.rb2.onClick = function()
        {
            updateDynamicControls();
        }

        skyboxPanel.radio_grp.rb1 = skyboxPanel.radio_grp.add('radiobutton', [6, 22, 295, 40],  localize("$$$/AE/Script/VR/CreateFromCurrComp=Create VR from current compositon"));  // REVIEW change
        skyboxPanel.radio_grp.rb1.onClick = function()
        {
            updateDynamicControls();
        }
        
        skyboxPanel.size_label = skyboxPanel.add("statictext", [14, 89, 170, 109], localize("$$$/AE/Script/VR/Size=Size"));
        skyboxPanel.fps_label = skyboxPanel.add("statictext", [14, 119, 170, 139], localize("$$$/AE/Script/VR/FrameRate=Frame Rate"));
        skyboxPanel.duration_label = skyboxPanel.add("statictext", [14, 149, 170, 169], kDurationStr);

        skyboxPanel.size_input = skyboxPanel.add("dropdownlist", [202, 89, 296, 109], ["512x512", "1024x1024", "2048x2048", "4096x4096"]);
        skyboxPanel.size_input.selection = 1;
        skyboxPanel.fps_input = skyboxPanel.add ("dropdownlist", [202,119,296,139], ["8", "12", "15", "23,976", "24", "25", "29,97", "30", "50", "59,94", "60"]); 
        skyboxPanel.fps_input.selection = 6;
        skyboxPanel.duration_input = skyboxPanel.add ("edittext", [202,149,296,189], "0:00:30:00"); 
        
        skyboxPanel.btnCreateMaster = skyboxPanel.add("button", [13,179,297,209], localize("$$$/AE/Script/VR/CreateMaster=Create VR Master")); // REVIEW change
        skyboxPanel.btnCreateMaster.onClick = function()
        {
            app.beginUndoGroup(this.text);
            
            var newComp = createNewMaster();
            if(newComp!=null) 
            {
                selectComp(newComp);
                newComp.openInViewer();
            }
            
            app.endUndoGroup();
        
            updateDynamicControls();
        }

        skyboxPanel.btnGenerate = skyboxPanel.add("button", [13,215,297,245], kGenerateSkyBoxButtonLabel);
        skyboxPanel.btnGenerate.onClick = function()
        {
            app.beginUndoGroup(this.text);        
            runScriptPayload(skyboxPanel);
            app.endUndoGroup();
            
            updateDynamicControls();
        }
    
        skyboxPanel.cameraOptions = skyboxPanel.add("panel", [13, 244, 297, 324], kCameraSettingsStr);
        
        skyboxPanel.checkboxTwoNodeCamera = skyboxPanel.cameraOptions.add("checkbox", [75,10,240,30], kUse2NodeCamStr );
        skyboxPanel.checkboxTwoNodeCamera.value = true;
        
        skyboxPanel.checkboxNullParent = skyboxPanel.cameraOptions.add("checkbox", [75,30,240,50], kUse3DNullCamCtrlStr);
        skyboxPanel.checkboxNullParent.value = false;
        
        skyboxPanel.checkboxCenterCamera = skyboxPanel.cameraOptions.add("checkbox", [75,50,240,70], kCenterCameraStr );
        skyboxPanel.checkboxCenterCamera.value = false;
        
        skyboxPanel.advancedOptions = skyboxPanel.add("panel", [13, 329, 297, 389], kAdvancedSettingsStr);

        skyboxPanel.checkbox3dPlugins = skyboxPanel.advancedOptions.add("checkbox", [75,10,240,30], kIAmUsing3DPlugStr);
        skyboxPanel.checkbox3dPlugins.value = false;
        
        skyboxPanel.checkboxBlending = skyboxPanel.advancedOptions.add("checkbox", [75,30,240,50], kUseEdgeBlendStr);
        skyboxPanel.checkboxBlending.value = false;

        var activeComp = activeCompItem();
        if(activeComp!=null) skyboxPanel.radio_grp.rb1.value = true;
        else skyboxPanel.radio_grp.rb2.value = true;
        //updateDynamicControls();
    }

    function createUIControls_Extractor()
    {
        //skyboxPanel.add ('image', [5,5,305,65], new File('SkyBox Extractor.png'));
        
        skyboxPanel.select_comp_label = skyboxPanel.add("statictext", [14, 9, 305, 29], kSelectComp360FootStr);
        skyboxPanel.select_comp_label.alignment = "left";
        
        skyboxPanel.btnExtract = skyboxPanel.add("button", [13,58,297,88], kExtractSkyBoxButtonLabel);
        skyboxPanel.btnExtract.onClick = function()
        {
            app.beginUndoGroup(this.text);        
            runScriptPayload(skyboxPanel);
            app.endUndoGroup();
            
            updateDynamicControls();
        }
    
        skyboxPanel.qualityOptions = skyboxPanel.add("panel", [13, 92, 297, 142], localize("$$$/AE/Script/VR/QualSet=Quality Settings"));
        
        skyboxPanel.quality_label = skyboxPanel.qualityOptions.add("statictext", [10, 10, 170, 30], localize("$$$/AE/Script/VR/ConversionRes=Conversion Resolution"));
        
        skyboxPanel.quality_input = skyboxPanel.qualityOptions.add("dropdownlist", [202, 10, 274, 30],
            [   localize("$$$/AE/Script/VR/QualityLow=Low"),
                localize("$$$/AE/Script/VR/QualityMed=Medium"),
                localize("$$$/AE/Script/VR/QualityHigh=High"),
                localize("$$$/AE/Script/VR/QualityUltra=Ultra") ]);
        skyboxPanel.quality_input.selection = METTLE_EXTRACTOR_QUALITY.MEDIUM; 
    
        skyboxPanel.advancedOptions = skyboxPanel.add("panel", [13, 147, 297, 207], kAdvancedSettingsStr);

        skyboxPanel.checkbox3dPlugins = skyboxPanel.advancedOptions.add("checkbox", [75,10,240,30], kIAmUsing3DPlugStr);
        skyboxPanel.checkbox3dPlugins.value = false;
        
        skyboxPanel.checkboxBlending = skyboxPanel.advancedOptions.add("checkbox", [75,30,240,50], kUseEdgeBlendStr);
        skyboxPanel.checkboxBlending.value = false;

        updateDynamicControls();
    }

    function createUIControls_Editor()
    {
        skyboxPanel.btnCreate2D = skyboxPanel.add("button", [5, 10, 100, 40], localize("$$$/AE/Script/VR/Add2DEdit=Add 2D Edit"));
        skyboxPanel.btnCreate2D.onClick = function()
        {
            showCreateEditInstanceWindow(this.text, this.text, false);
        }
    
        skyboxPanel.btnCreate3D = skyboxPanel.add("button", [110, 10, 205, 40], localize("$$$/AE/Script/VR/Add3DEdit=Add 3D Edit"));
        skyboxPanel.btnCreate3D.onClick = function()
        {
            showCreateEditInstanceWindow(this.text, this.text, true);
        }
    }

    function createUIControls()
    {
        if(script_type==METTLE_SCRIPT_TYPE.CREATOR) createUIControls_Creator();
        else if(script_type==METTLE_SCRIPT_TYPE.EXTRACTOR) createUIControls_Extractor();
        else if(script_type==METTLE_SCRIPT_TYPE.COMPOSER) createUIControls_Editor();
    }

    function showCreateSkyBoxWindow(windowTitle)
    {
        var wnd = new Window("palette", windowTitle, [0,0,310,280]);
        
        wnd.select_comp_label = wnd.add("statictext", [14, 4, 305, 24], localize("$$$/AE/Script/VR/CreateBlankSelect=Create blank or select existing 360 footage:"));
        wnd.select_comp_label.alignment = "left";
        
        var compNames = allCompNamesWithinItemCollection(app.project.items, true, localize("$$$/AE/Script/VR/CreateBlank=<Create Blank>"));
        wnd.comp_selector = wnd.add ("dropdownlist", [13,23,296,43], compNames); 
        wnd.comp_selector.selection = compSelectorIndex(compNames);
        wnd.comp_selector.onChange = function()
        {
            /* Disable comp properties when exisitng comp selected */
           
            var existingSelected = (this.selection.index>0);
            
            wnd.compOptions.enabled = !existingSelected;
        }
    
        wnd.compOptions = wnd.add("panel", [13, 50, 297, 230], kCompositionSettingsStr);
        
        var newCompName = nextUniqueMasterCompName();
        
        wnd.title_input = wnd.compOptions.add("edittext", [10,15,274,35], newCompName); 
        
        wnd.size_label = wnd.compOptions.add("statictext", [10, 45, 110, 65], localize("$$$/AE/Script/VR/OutWidth=Output Width"));
        wnd.format_label = wnd.compOptions.add("statictext", [10, 75, 110, 95], localize("$$$/AE/Script/VR/OutFormat=Output Format"));
        wnd.fps_label = wnd.compOptions.add("statictext", [10, 105, 110, 125], localize("$$$/AE/Script/VR/fps=FPS"));
        wnd.duration_label = wnd.compOptions.add("statictext", [10, 135, 110, 155], kDurationStr );

        wnd.size_input = wnd.compOptions.add("edittext", [130, 45, 274, 65], "4096");

        // FUTURE list order dependency?
        wnd.format_input = wnd.compOptions.add("dropdownlist", [130, 75, 274, 95],
            [   localize("$$$/AE/Script/VR/cubemap43=Cube-map 4:3"),
                localize("$$$/AE/Script/VR/spheremap43=Sphere-map"),
                localize("$$$/AE/Script/VR/equ21=Equirectangular 2:1"),
                localize("$$$/AE/Script/VR/fisheye=Fisheye (FullDome)"),
                localize("$$$/AE/Script/VR/cubemapFB32=Cube-map Facebook 3:2"),
                localize("$$$/AE/Script/VR/cubemappano2vr32=Cube-map Pano2VR 3:2"),
                localize("$$$/AE/Script/VR/cubemapGearVR61=Cube-map GearVR 6:1"),
                localize("$$$/AE/Script/VR/cubemapequi169=Equirectangular 16:9")]);
        wnd.format_input.selection = 2;
        wnd.fps_input = wnd.compOptions.add ("dropdownlist", [130,105,274,125], ["8", "12", "15", "23,976", "24", "25", "29,97", "30", "50", "59,94", "60"]); 
        wnd.fps_input.selection = 6;
        wnd.duration_input = wnd.compOptions.add ("edittext", [130,135,274,155], "0:00:30:00"); 
        
        wnd.defaultElement = wnd.add("button", [13,240,297,270], windowTitle);
        wnd.defaultElement.onClick = function()
        {
            var selectedComp = null;
            if(wnd.comp_selector.selection>0)
            {
                selectedComp = selectedCompItem(wnd);
            }
            else
            {
                /* Prepare dummy comp to pass to create function */
                
                var compName = wnd.title_input.text.replace(/:/g, "_");
                var compWidth = parseInt(wnd.size_input.text);
                var compHeight = compWidth / 2; // will be adjusted by Converter according to output format
                var frameRate = parseFloat(wnd.fps_input.selection.text.replace(",","."));
                
                var desiredOutputFormat = wnd.format_input.selection.index;
                
                var durationRaw = wnd.duration_input.text;     
                var fields = durationRaw.split(":");
                for(var i=0; i<fields.length; i++) fields[i] = parseInt(fields[i]);
                var durationSec = 0;
                if(fields.length==1) durationSec = fields[0]/frameRate;
                else if(fields.length==2) durationSec = fields[0] + fields[1]/frameRate;
                else if(fields.length==3) durationSec = fields[0]*60 + fields[1] + fields[2]/frameRate;
                else if(fields.length>=4) durationSec = fields[0]*60*60 + fields[1]*60 + fields[2] + fields[3]/frameRate;

                if(durationSec==0)
                {
                    alert(localize("$$$/AE/Script/VR/IncorrectDurationAlert=Incorrect duration value."));
                    return;
                }
                
                var dummyComp = 
                {
                    name: compName,
                    width: compWidth,
                    height: compHeight, // will be adjusted by Converter according to Output Format
                    pixelAspect: 1.0,
                    duration: durationSec,
                    frameRate: frameRate
                };
            
                selectedComp = dummyComp;
            }
            
            /* Call create function */
            
            app.beginUndoGroup(this.text);     
            var outputTuple = createSkyBoxOutputFromComp(selectedComp, false, false, desiredOutputFormat);
            app.endUndoGroup();
            
            var success = (outputTuple[0]!=null && outputTuple[1]!=null);
            
            if(success)
                wnd.close();
                
            refreshSkyBoxComposerUI();
        }
                
        wnd.center();
        wnd.show();
    }

    function showCreateEditInstanceWindow(windowTitle, buttonTitle, threeDMode)
    {       
        var wnd = new Window("palette", windowTitle, [0,0,310,threeDMode?345:260]);
        
        wnd.threeDMode = threeDMode;
        
        wnd.select_comp_label = wnd.add("statictext", [14, 4, 305, 24], kSelectComp360FootStr);
        wnd.select_comp_label.alignment = "left";
        
        var compNames = allCompNamesWithinItemCollection(app.project.items, true, localize("$$$/AE/Script/VR/Blank=<Blank>")).concat(allCompNamesOfImplicitSkyBoxMasters());
        wnd.comp_selector = wnd.add ("dropdownlist", [13,23,296,43], compNames); 
        wnd.comp_selector.selection = compSelectorIndex(compNames);  
    
        wnd.compOptions = wnd.add("panel", [13, 50, 297, 130], kCompositionSettingsStr);
        
        wnd.width_label = wnd.compOptions.add("statictext", [10, 10, 170, 30], localize("$$$/AE/Script/VR/CompWidth2=Comp Width"));
        wnd.width_input = wnd.compOptions.add("edittext", [202,10,274,30], "1920"); 
        
        wnd.ratio_label = wnd.compOptions.add("statictext", [10, 40, 170, 60], localize("$$$/AE/Script/VR/AspectRatio=Aspect Ratio"));
        wnd.ratio_input = wnd.compOptions.add("dropdownlist", [202, 40, 274, 60], ["1:1", "4:3", "16:9", "16:10"]);
        wnd.ratio_input.selection = METTLE_COMPOSITION_ASPECT_RATIO.R_16_9; 

        wnd.cameraOptions = wnd.add("panel", [13, 135, 297, 215], kCameraSettingsStr);
        
        wnd.checkboxTwoNodeCamera = wnd.cameraOptions.add("checkbox", [75,10,240,30], kUse2NodeCamStr);
        wnd.checkboxTwoNodeCamera.value = true;
        
        wnd.checkboxNullParent = wnd.cameraOptions.add("checkbox", [75,30,240,50], kUse3DNullCamCtrlStr );
        wnd.checkboxNullParent.value = false;
        
        wnd.checkboxCenterCamera = wnd.cameraOptions.add("checkbox", [75,50,240,70], kCenterCameraStr);
        wnd.checkboxCenterCamera.value = false;
        
        var bottomPoint = 215;
        
        if(threeDMode)
        {
            wnd.advancedOptions = wnd.add("panel", [13, 220, 297, 300], kAdvancedSettingsStr);

            wnd.checkbox3dPlugins = wnd.advancedOptions.add("checkbox", [75,10,240,30], kIAmUsing3DPlugStr);
            wnd.checkbox3dPlugins.value = false;
            
            wnd.checkboxBlending = wnd.advancedOptions.add("checkbox", [75,30,240,50], kUseEdgeBlendStr );
            wnd.checkboxBlending.value = false;
            
            wnd.checkboxAlpha = wnd.advancedOptions.add("checkbox", [75,50,240,70], kSourceFootHasAlpha );
            wnd.checkboxAlpha.value = false;
            
            bottomPoint = 300;
        }
    
        wnd.defaultElement = wnd.add("button", [13,bottomPoint+5,297,bottomPoint+35], buttonTitle);
        wnd.defaultElement.onClick = function()
        {
            app.beginUndoGroup(this.text);     
            var success = runScriptPayload(wnd);
            app.endUndoGroup();
            
            if(success)
                wnd.close();
                
            refreshSkyBoxComposerUI();
        }
    
        bottomPoint += 35;
        
        wnd.center();
        wnd.show();
    }

    function findTrackerCameraAnyLang(comp)
    {
        var trackerCamera = null;
        for (var langstr = 0; langstr < kAdobeTrackerCameraNameA.length && trackerCamera == null; langstr++) {
              trackerCamera = comp.handle.layer(kAdobeTrackerCameraNameA[langstr]);
        }
        return trackerCamera;
    }

    function showEditCompPropertiesWindow(outputCompIndex, editCompIndex)
    {
        var outputComp = skyboxOutputComps[outputCompIndex];
        if(outputComp==null) return;
        var editComp = outputComp.editComps[editCompIndex];
        if(editComp==null) return;
                
        var wnd = new Window("palette", localize("$$$/AE/Script/VR/EditProp=Edit Properties"), [0,0,310,(editComp.threeD?245:100)]);
        
        wnd.userGivenNameInput = wnd.add("edittext", [10,5,300,25], editComp.userGivenName); 
        
        var bottomPoint = 30;

        if(editComp.threeD)
        {
            wnd.checkbox3dPlugins = wnd.add("checkbox", [90,30,220,50], localize("$$$/AE/Script/VR/Using3DPlug4=Using 3D plugins"));
            wnd.checkbox3dPlugins.value = editComp.threeDPluginsCompatible;
            
            wnd.checkboxBlending = wnd.add("checkbox", [90,50,220,70], localize("$$$/AE/Script/VR/EdgeBlending4=Edge blending"));
            wnd.checkboxBlending.value = editComp.threeDEdgeBlending;
            
            wnd.checkboxAlpha = wnd.add("checkbox", [90,70,250,90], kSourceFootHasAlpha);
            wnd.checkboxAlpha.value = editComp.srcHasAlpha;
            wnd.checkboxAlpha.enabled = false; // can't be changed after Edit was created
            
            wnd.btnImport = wnd.add("button", [10,100,300,120], localize("$$$/AE/Script/VR/Import3DComp=Import 3D Comp"));
            wnd.btnImport.outputCompIndex = outputCompIndex;
            wnd.btnImport.editCompIndex = editCompIndex;
            wnd.btnImport.onClick = function()
            {
                var outputComp = skyboxOutputComps[this.outputCompIndex];
                if(outputComp==null) return;
                var editComp = outputComp.editComps[this.editCompIndex];
                if(editComp==null) return;
                
                var success = import3DComp(editComp.handle, this.text);
                
                if(success)
                    wnd.close();
            }
        
            wnd.btnTrackerApply = wnd.add("button", [10,125,300,145], localize("$$$/AE/Script/VR/ApplyCamTrack=Apply AE 3D Camera Tracker"));
            wnd.btnTrackerApply.outputCompIndex = outputCompIndex;
            wnd.btnTrackerApply.editCompIndex = editCompIndex;
            wnd.btnTrackerApply.onClick = function()
            {
                var outputComp = skyboxOutputComps[this.outputCompIndex];
                if(outputComp==null) return;
                var editComp = outputComp.editComps[this.editCompIndex];
                if(editComp==null) return;
                
                var success = apply3DCameraTracker(editComp.handle);
            }
        
            wnd.btnTrackerSetupFor3D = wnd.add("button", [10,150,152,170], localize("$$$/AE/Script/VR/TrackScene=Track Scene"));
            wnd.btnTrackerSetupFor3D.outputCompIndex = outputCompIndex;
            wnd.btnTrackerSetupFor3D.editCompIndex = editCompIndex;
            wnd.btnTrackerSetupFor3D.onClick = function()
            {
                var outputComp = skyboxOutputComps[this.outputCompIndex];
                if(outputComp==null) return;
                var editComp = outputComp.editComps[this.editCompIndex];
                if(editComp==null) return;
                
                // try all possible tracker camera lang variants
                var trackerCamera = findTrackerCameraAnyLang(editComp);

                // still not found? ask
                if (trackerCamera == null) {
                    showSelectTrackerCameraWindow(editComp.handle, this.text);
                }
                if(trackerCamera==null) return;
                
                var success = setupTrackerCameraForStab(editComp.handle, trackerCamera, false) && setupTrackerCameraFor3D(editComp.handle, trackerCamera, true) && updateReorientCamera(outputComp, editComp, false);
            
                if(success)
                    wnd.close();
                    
                refreshSkyBoxComposerUI();
            }
        
            wnd.btnTrackerSetupForStab = wnd.add("button", [158,150,300,170], localize("$$$/AE/Script/VR/StabFoot=Stabilize Footage"));
            wnd.btnTrackerSetupForStab.outputCompIndex = outputCompIndex;
            wnd.btnTrackerSetupForStab.editCompIndex = editCompIndex;
            wnd.btnTrackerSetupForStab.onClick = function()
            {
                var outputComp = skyboxOutputComps[this.outputCompIndex];
                if(outputComp==null) return;
                var editComp = outputComp.editComps[this.editCompIndex];
                if(editComp==null) return;
                
                var trackerCamera = findTrackerCameraAnyLang(editComp) || showSelectTrackerCameraWindow(editComp.handle, this.text);
                if(trackerCamera==null) return;
                
                var success = setupTrackerCameraFor3D(editComp.handle, trackerCamera, false) && setupTrackerCameraForStab(editComp.handle, trackerCamera, true) && updateReorientCamera(outputComp, editComp, true);
            
                if(success)
                    wnd.close();

                refreshSkyBoxComposerUI();
            }
        
            bottomPoint = 175;
        }
    
        wnd.btnDelete = wnd.add("button", [10,bottomPoint,300,bottomPoint+20], localize("$$$/AE/Script/VR/Delete=Delete"));
        wnd.btnDelete.outputCompIndex = outputCompIndex;
        wnd.btnDelete.editCompIndex = editCompIndex;
        wnd.btnDelete.onClick = function()
        {
            var outputComp = skyboxOutputComps[this.outputCompIndex];
            if(outputComp==null) return;
            var editComp = outputComp.editComps[this.editCompIndex];
            if(editComp==null) return;
            
            var deleteStrFormat = localize("$$$/AE/Script/VR/DeleteThisEditComp=Delete @1?");
            if (confirm(deleteStrFormat.replace("@1", editComp.userGivenName)))
            {
                app.beginUndoGroup("Delete VR Edit");   
                var success = deleteEditComp(outputComp, editCompIndex);
                app.endUndoGroup();
                
                if(!success)
                    alert(localize("$$$/AE/Script/VR/WrongManualDeleteAlert=Something went wrong. Please try to delete manually."));
                
                wnd.close();
                
                refreshSkyBoxComposerUI();
            }
        }
    
        wnd.defaultElement = wnd.add("button", [10,bottomPoint+25,300,bottomPoint+55], localize("$$$/AE/Script/VR/Save=Save"));
        wnd.defaultElement.wnd = wnd;
        wnd.defaultElement.outputCompIndex = outputCompIndex;
        wnd.defaultElement.editCompIndex = editCompIndex;
        wnd.defaultElement.onClick = function()
        {
            var outputComp = skyboxOutputComps[this.outputCompIndex];
            if(outputComp==null) return;
            var editComp = outputComp.editComps[this.editCompIndex];
            if(editComp==null) return;
                    
            var properties = compPropertiesFromTag(editComp.handle.comment);
            var useThreeDPluginsPrevious = properties.useThreeDPlugins;
            var useEdgeBlendingPrevious = properties.useEdgeBlending;
            properties.useThreeDPlugins = editComp.threeD && (this.wnd.checkbox3dPlugins.value==true);
            properties.useEdgeBlending = editComp.threeD && (this.wnd.checkboxBlending.value==true);
            properties.srcHasAlpha = editComp.threeD && (this.wnd.checkboxAlpha.value==true);
            // note: this updates the above properties WITHOUT the user given name update (which is done later, below)
            editComp.handle.comment = compTagFromProperties(properties.isOutputComp, properties.isEditComp, properties.userGivenName, properties.isThreeD, properties.useThreeDPlugins, properties.useEdgeBlending, properties.useTwoNodeCamera, properties.useNullParent, properties.centerCamera, properties.reorientCamera, properties.srcHasAlpha);
                
            if(editComp.threeD && (useThreeDPluginsPrevious!=properties.useThreeDPlugins || useEdgeBlendingPrevious!=properties.useEdgeBlending))
            {
                var generatorOutputCompName = generatorOutputCompNameForEditCompName(editComp.handle.name);
                generateSkyBoxFromComp(editComp.handle, generatorOutputCompName, outputComp.handle.width, false, properties.useTwoNodeCamera, properties.useNullParent, !properties.useThreeDPlugins, properties.useEdgeBlending, false, false);
                
                var selectedComp = selectedCompItem(null);
                if(selectedComp!=null && useThreeDPluginsPrevious!=properties.useThreeDPlugins)
                {
                    var viewerLayer = findViewerLayerInComp(editComp.handle);
                    if(viewerLayer!=null)
                    {
                        if(selectedComp.name==outputComp.handle.name && !properties.useThreeDPlugins)
                             viewerLayer.enabled = false;
                        else
                            viewerLayer.enabled = true;
                    }
                }
            }
        
            // because the global structure is ordered by the given user name, and
            // because that structure is in use for other editing-in-progress
            // delay the user name change until just before we refresh the structure again
            properties.userGivenName = this.wnd.userGivenNameInput.text.replace(/:/g, "_");

            // also, some issue with removing "(3D)" from the name. if they removed it, readd it to avoid the "going blank" problem
            if (editComp.threeD && properties.userGivenName.indexOf("(3D)") < 0) {
                properties.userGivenName = properties.userGivenName + " (3D)";
            }
            editComp.handle.comment = compTagFromProperties(properties.isOutputComp, properties.isEditComp, properties.userGivenName, properties.isThreeD, properties.useThreeDPlugins, properties.useEdgeBlending, properties.useTwoNodeCamera, properties.useNullParent, properties.centerCamera, properties.reorientCamera, properties.srcHasAlpha);

            wnd.close();
            
            refreshSkyBoxComposerUI();
        }
    
        /* Show window */
        
        wnd.center();
        wnd.show();
    }

    function showSelectTrackerCameraWindow(editComp, windowTitle)
    {
        /* Extract all camera names from the current composition, besides SkyBox camera */
        
        var cameraNames = [kPoplistNoneChoiceStr];
        for(var i = 1; i<editComp.layers.length; i++)
        {
            var curItem = editComp.layers[i];
            curItem.selected = false; // we will select precomp layer only to make it easier for the user to find Adobe Tracker settings on the Effect Controls
            
            if(!(curItem instanceof CameraLayer)) continue;
            if (isMasterCameraLayer(curItem)) continue;
                
            cameraNames.push(curItem.name);
        }
    
        /* Select first non-skybox camera */
    
        var defaultSelectionIndex = (cameraNames.length > 1 ? 1: 0);
    
        /* Selecte precomp layer to make it easier for user to find 3D Camera Tracker on Effect Controls */
        
        var viewerLayer = findViewerLayerInComp(editComp);
        if(viewerLayer!=null) viewerLayer.selected = true;
    
        /* Build window */
    
        var wnd = new Window("dialog", windowTitle, [0,0,356,138]);
        wnd.selectedCamera = null;
        
        wnd.select_cam_label = wnd.add("statictext", [14, 4, 350, 24], localize("$$$/AE/Script/VR/SelectTrackCam=Select tracker camera. Hint: if you use Adobe Tracker"));
        wnd.select_cam_label2 = wnd.add("statictext", [14, 24, 350, 44], localize("$$$/AE/Script/VR/GoToEffCtrls=go to Effect Controls and press 'Create Camera'."));
        
        wnd.cam_selector = wnd.add ("dropdownlist", [13,43,340,63], cameraNames); 
        wnd.cam_selector.selection = defaultSelectionIndex;
        wnd.cam_selector.wnd = wnd;
        wnd.cam_selector.onChange = function()
        {
            wnd.defaultElement.enabled = (this.selection!=null && this.selection.index>0);
        }
    
        wnd.cancelElement = wnd.add("button", [13,73,341,93], kCancelStr);
        
        wnd.defaultElement = wnd.add("button", [13,98,341,128], windowTitle);
        wnd.defaultElement.enabled = (wnd.cam_selector.selection!=null && wnd.cam_selector.selection.index>0);
        wnd.defaultElement.wnd = wnd;
        wnd.defaultElement.editComp = editComp;
        wnd.defaultElement.onClick = function()
        {
            wnd.selectedCamera = (wnd.cam_selector.selection!=null ? editComp.layer(wnd.cam_selector.selection.text) : null);
            
            wnd.close();
        }
    
        /* Show window and wait for it */
        
        wnd.center();
        wnd.show();
        
        return wnd.selectedCamera;
    }

    // This should only operate on V2 content
    function refreshSkyBoxComposerCompTree()
    {
        skyboxOutputComps = [];
        
        var possibleOutputComps = allCompsWithinItemCollection(app.project.items, false);
        
        for(var i=0; i<possibleOutputComps.length; i++)
        {
            var possibleOutputComp = possibleOutputComps[i];
            if(possibleOutputComp==null) continue;
            
            // note: V1 content won't pass this and will get stripped out here
            var compProperties = compPropertiesFromTag(possibleOutputComp.comment);
            if (compProperties.isOutputComp && (compProperties.version == kSkyBoxTagPrefixSlot1_Original || compProperties.version == kSkyBoxTagPrefixSlot1_v2))
            {
                 var folderName = possibleOutputComp.name;      //FIXME localization issue?  Assumption of exact name match.. reasonable?
                 var skyboxFolder = itemByNameWithinItemCollection(folderName, "FolderItem", app.project.items);
                 if(skyboxFolder==null) continue;
                 
                 var outputComp = possibleOutputComp;
                
                /* Found Output comp, create object to add to the tree */

                var curOutputComp = {};
                curOutputComp.handle = outputComp;
                curOutputComp.skyboxTitle = compProperties.userGivenName;
                curOutputComp.editComps = [];
                
                /* Find edit instances, add to the tree */
                                
                var possibleEditComps = allCompsWithinItemCollection(skyboxFolder.items, false);              
                 for(var j=0; j<possibleEditComps.length; j++)
                 {
                    var editComp = possibleEditComps[j];
                    if (editComp == null || editComp.parentFolder != skyboxFolder || editComp.comment == "") continue;
                    var compProperties = compPropertiesFromTag(editComp.comment);
                    if (!compProperties.isEditComp) continue;   // localization independent test for edit comp, and we shouldn't have V1 content here
                    
                    var curEditComp = {};
                    curEditComp.handle = editComp;
                    curEditComp.handle.name = editComp.name;
                    curEditComp.userGivenName = compProperties.userGivenName;
                    curEditComp.threeD = compProperties.isThreeD;
                    curEditComp.threeDPluginsCompatible = compProperties.useThreeDPlugins;
                    curEditComp.threeDEdgeBlending = compProperties.useEdgeBlending;
                    curEditComp.camTwoNode = compProperties.useTwoNodeCamera;
                    curEditComp.camNullParent = compProperties.useNullParent;
                    curEditComp.camCenter = compProperties.centerCamera;
                    curEditComp.camReorient = compProperties.reorientCamera;
                    curEditComp.srcHasAlpha = compProperties.srcHasAlpha;

                     curOutputComp.editComps.push(curEditComp);
                 }

                // want the edit comps we actually found sorted by name
                curOutputComp.editComps.sort(function (a, b) { if (a.name < b.name) return -1; if (a.name > b.name) return 1; return 0; });

                /* Add to the tree */
                
                skyboxOutputComps.push(curOutputComp);
            }
        }
    }

    function refreshSkyBoxComposerUI()
    {
        refreshSkyBoxComposerCompTree();
        
        var kEditCompBlockHeight = 50;
        var kButtonBlockHeight = 50;
        var kButtonHeight = 40;
        var kLeftMargin = 4;
        var kTopMargin = 50;
        var kWidth = 200;
        var kLeftMarginInsideBlock = 4;
        var kTopMarginInsideBlock = 15;
        var kBottomMarginInsideBlock = 5;
        var kWidthInsideBlock = 188;
        
        var bottomPoint = kTopMargin;
        
        if(skyboxPanel.outputCompSections!=null)
        {
            for(var i=0; i<skyboxPanel.outputCompSections.length; i++)
                skyboxPanel.remove(skyboxPanel.outputCompSections[i]);
        }
        skyboxPanel.outputCompSections = [];
        
        for(var i=0; i<skyboxOutputComps.length; i++)
        {
            var curOutputComp = skyboxOutputComps[i];
            var totalEditComps = curOutputComp.editComps.length;
            if(totalEditComps==0) continue;
            
            curOutputComp.editComps = sortEditCompsByUserGivenName(curOutputComp.editComps);
            
            var curOutputCompSection = skyboxPanel.add("panel", [kLeftMargin, bottomPoint, kLeftMargin+kWidth, bottomPoint+kTopMarginInsideBlock+kEditCompBlockHeight*(totalEditComps+1)+kBottomMarginInsideBlock], curOutputComp.skyboxTitle);
            skyboxPanel.outputCompSections.push(curOutputCompSection);
            
            for(var j=0; j<totalEditComps; j++)
            {
                var curEditComp = curOutputComp.editComps[j];
                
                var button = curOutputCompSection.add("button", [kLeftMarginInsideBlock,kTopMarginInsideBlock+j*kButtonBlockHeight,kLeftMarginInsideBlock+kWidthInsideBlock/2+20,kTopMarginInsideBlock+j*kButtonBlockHeight+kButtonHeight], curEditComp.userGivenName);
                button.outputCompIndex = i;
                button.editCompIndex = j;
                button.onClick = function()
                {
                    var outputComp = skyboxOutputComps[this.outputCompIndex];
                    if(outputComp==null) return;
                    var editComp = outputComp.editComps[this.editCompIndex];
                    if(editComp==null) return;

                    /* Show viewer layer during editing 3D skyboxes that use Collapse Transform method */
                    
                    if(editComp.threeD && !editComp.useThreeDPlugins)
                    {
                        var viewerLayer = findViewerLayerInComp(editComp.handle);
                        if(viewerLayer!=null) viewerLayer.enabled = true;
                    }
                    
                    /* Activate and show edit comp */
                    
                    selectComp(editComp.handle);
                    editComp.handle.openInViewer();
                }
            
                var checkboxReorient = curOutputCompSection.add("checkbox", [kLeftMarginInsideBlock+kWidthInsideBlock/2+25,kTopMarginInsideBlock+j*kButtonBlockHeight,kLeftMarginInsideBlock+kWidthInsideBlock,kTopMarginInsideBlock+j*kButtonBlockHeight+13], localize("$$$/AE/Script/VR/Reorient=Reorient"));
                checkboxReorient.value = curEditComp.camReorient;
                checkboxReorient.outputCompIndex = i;
                checkboxReorient.editCompIndex = j;
                checkboxReorient.onClick = function()
                {
                    var outputComp = skyboxOutputComps[this.outputCompIndex];
                    if(outputComp==null) return;
                    var selectedEditComp = outputComp.editComps[this.editCompIndex];
                    if(selectedEditComp==null) return;
                    
                    var reorient = (this.value==true);
                    updateReorientCamera(outputComp, selectedEditComp, reorient);
                }
            
                button = curOutputCompSection.add("button", [kLeftMarginInsideBlock+kWidthInsideBlock/2+25,kTopMarginInsideBlock+j*kButtonBlockHeight+20,kLeftMarginInsideBlock+kWidthInsideBlock,kTopMarginInsideBlock+j*kButtonBlockHeight+39], localize("$$$/AE/Script/VR/Props=Properties"));
                button.outputCompIndex = i; 
                button.editCompIndex = j;
                button.onClick = function()
                {
                    showEditCompPropertiesWindow(this.outputCompIndex, this.editCompIndex);
                }
            }
        
            var bottomPointInBlock = kTopMarginInsideBlock+totalEditComps*kButtonBlockHeight;
        
            var button = curOutputCompSection.add("button", [kLeftMarginInsideBlock,bottomPointInBlock,kLeftMarginInsideBlock+kWidthInsideBlock,bottomPointInBlock+kButtonHeight], localize("$$$/AE/Script/VR/OpenOutputRender=Open Output/Render"));
            button.outputCompIndex = i;            
            button.onClick = function()
            {
                var outputComp = skyboxOutputComps[this.outputCompIndex];
                if(outputComp==null) return;
                
                /*Match output duration the longest Edit duration */
                
                var durationArr=[];
                for(var k_i=0; k_i<outputComp.editComps.length; k_i++) {
                    durationArr.push(outputComp.editComps[k_i].handle.duration);
                }
                var maxDuration = Math.max.apply(null, durationArr);
                outputComp.handle.duration = maxDuration; 
                
                /* Hide viewer layers during previewing 3D skyboxes & refresh 3D skyboxes if needed*/
                
                for(var i=0; i<outputComp.editComps.length; i++)
                {
                    var editComp = outputComp.editComps[i];
                    if(editComp.threeD)
                    {
                        if(!editComp.threeDPluginsCompatible)
                        {
                            var viewerLayer = findViewerLayerInComp(editComp.handle);
                            if(viewerLayer!=null) viewerLayer.enabled = false;
                        }
                    
                        var generatorOutputCompName = generatorOutputCompNameForEditCompName(editComp.handle.name);
                        generateSkyBoxFromComp(editComp.handle, generatorOutputCompName, outputComp.handle.width, false, editComp.camTwoNode, editComp.camNullParent, !editComp.threeDPluginsCompatible, editComp.threeDEdgeBlending, false, false);
                    }
                }
            
                /* Activate and show output comp */
                
                selectComp(outputComp.handle);
                outputComp.handle.openInViewer();
            }            
            
            bottomPoint = bottomPoint + kTopMarginInsideBlock + kEditCompBlockHeight*(totalEditComps+1) + kBottomMarginInsideBlock + 10;
        }
    }

    function resetLayerOrientation(layer)
    {
        layer.transform.orientation.setValue([0,0,0]);
        layer.transform.xRotation.setValue(0);
        layer.transform.yRotation.setValue(0);
        layer.transform.zRotation.setValue(0);
        
        if(layer instanceof CameraLayer)
        {
            if(layer.autoOrient== AutoOrientType.CAMERA_OR_POINT_OF_INTEREST)
                layer.transform.pointOfInterest.setValue(layer.transform.position.value); 
        }
    }

    function resetLayerPosition(layer)
    {
        layer.transform.position.setValue([0,0,0]);
        
        if(layer instanceof CameraLayer)
        {
            if(layer.autoOrient== AutoOrientType.CAMERA_OR_POINT_OF_INTEREST)
                layer.transform.pointOfInterest.setValue(layer.transform.position.value); 
        }
    }

    function createMasterCamInComp(comp, recenterCamera, useTwoNodeCamera, useNullParent)
    {
        var cameraZoom = comp.height / 2; // this is equivalent to 90 degrees vertical field of view in After Effects
        var compCenter = [comp.width/2, comp.height/2, 0];
        var defaultCamPosition = [comp.width/2, comp.height/2, -cameraZoom];

        var masterCam = findMasterCameraWithinItemCollection( comp.layers);
        if(masterCam==null)
        {
            masterCam = comp.layers.addCamera(kMasterCameraNameLocalize, [0, 0]);
            masterCam.comment = kMasterCameraCommentMarker;        // marks this layer as the master camera
            masterCam.zoom.setValue(cameraZoom);
            masterCam.transform.position.setValue(defaultCamPosition);
            masterCam.transform.pointOfInterest.setValue(defaultCamPosition);  
        }
    
        var previousMasterCamLockStatus = masterCam.locked;
        masterCam.locked = false;
        
        if(useTwoNodeCamera)
            masterCam.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST; 
        else
            masterCam.autoOrient = AutoOrientType.NO_AUTO_ORIENT; 
        
        var nullParent = findMasterNullParentWithinItemCollection( comp.layers);
        if(nullParent==null && useNullParent)
        {
            nullParent = comp.layers.addNull();
            nullParent.name = kMasterNullParentNameLocalize;
            nullParent.comment = kMasterNullParentNameCommentMarker;
            nullParent.threeDLayer = true;
            nullParent.transform.position.setValue(defaultCamPosition);
            
            //masterCam.transform.position.setValue([0,0,0]);
            //masterCam.transform.pointOfInterest.setValue([0,0,0]);  
            masterCam.parent = nullParent;
        }
        else if(nullParent!=null && !useNullParent)
        {
            nullParent.remove();
        }
    
        if(recenterCamera)
        {
            if(useNullParent) nullParent.transform.position.setValue(compCenter);
            else
            {
                masterCam.transform.position.setValue(compCenter);
                if(masterCam.autoOrient == AutoOrientType.CAMERA_OR_POINT_OF_INTEREST) 
                    masterCam.transform.pointOfInterest.setValue(compCenter);  
            }
        }
    
        masterCam.locked = previousMasterCamLockStatus;
        
        return [masterCam, nullParent];
    }

    function createNewMaster()
    {
         if(!(app.project instanceof Project)) app.newProject();
         
         var size = parseInt(skyboxPanel.size_input.selection.text);
         var width = size;
         var height = size;
         var frameRate = parseFloat(skyboxPanel.fps_input.selection.text.replace(",","."));
         
         var durationRaw = skyboxPanel.duration_input.text;     
         var fields = durationRaw.split(":");
         for(var i=0; i<fields.length; i++) fields[i] = parseInt(fields[i]);
         var durationSec = 0;
         if(fields.length==1) durationSec = fields[0]/frameRate;
         else if(fields.length==2) durationSec = fields[0] + fields[1]/frameRate;
         else if(fields.length==3) durationSec = fields[0]*60 + fields[1] + fields[2]/frameRate;
         else if(fields.length>=4) durationSec = fields[0]*60*60 + fields[1]*60 + fields[2] + fields[3]/frameRate;
         
         if(durationSec==0)
         {
             alert(localize("$$$/AE/Script/VR/IncorrectDurationAlert=Incorrect duration value."));
              app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
              return null;
         }
     
        // duplicate way of doing unique operation?
        var compName = kBlankSkyBoxMasterPrefix;
        var totalSkyBoxMasters = countItemsWithPrefix(compName, "CompItem", 3); // new master
        if(totalSkyBoxMasters>0) compName = compName + " " + (totalSkyBoxMasters+1);
         
        var newComp = app.project.items.addComp(compName, width, height, 1.0, durationSec, frameRate);

        /* Create Master Camera */
        
        createMasterCamInComp(newComp, skyboxPanel.checkboxCenterCamera.value==true, skyboxPanel.checkboxTwoNodeCamera.value==true, skyboxPanel.checkboxNullParent.value==true);
         
        return newComp;
    }

    function import3DComp(destComp, windowTitle)
    {
        var wnd = new Window("dialog", windowTitle, [0,0,310,123]);
        wnd.importSucceeded = false;
        
        wnd.select_comp_label = wnd.add("statictext", [14, 4, 305, 24], localize("$$$/AE/Script/VR/Select3DCompImp=Select 3D composition to import from:"));
        wnd.select_comp_label.alignment = "left";
        
        var compNames = allCompNamesWithinItemCollection(app.project.items, true, kPoplistNoneChoiceStr);
        wnd.comp_selector = wnd.add ("dropdownlist", [13,23,296,43], compNames); 
        wnd.comp_selector.selection = compSelectorIndex(compNames);
        wnd.comp_selector.wnd = wnd;
        wnd.comp_selector.onChange = function()
        {
            wnd.defaultElement.enabled = (this.selection!=null && this.selection.index>0);
        }
        
        wnd.cancelElement = wnd.add("button", [13,53,297,73], kCancelStr);
    
        wnd.defaultElement = wnd.add("button", [13,78,297,108], windowTitle);
        wnd.defaultElement.enabled = (wnd.comp_selector.selection!=null && wnd.comp_selector.selection.index>0);
        wnd.defaultElement.onClick = function()
        {
            var selectedComp = selectedCompItem(wnd);
            if(selectedComp==null)
            {
                alert(kPleaseSelectCompToProcess );
                return;
            }
                
            app.beginUndoGroup(this.text);     
            var success = copyAllLayersBesidesCameras(selectedComp, destComp);
            app.endUndoGroup();
            
            if(success)
            {
                wnd.importSucceeded = true;
                
                destComp.openInViewer();
                wnd.close();
            }
        }
    
        wnd.center();
        wnd.show();
        
        return wnd.importSucceeded;
    }

    function apply3DCameraTracker(destComp)
    {
        var viewerLayer = findViewerLayerInComp(destComp);
        if(viewerLayer==null)
        {
            alert(localize("$$$/AE/Script/VR/CantFindFootageAlert=Error: Can't find 360 footage to track."));
            return false;
        }
        
        if(!viewerLayer.effect.canAddProperty(kAdobeTrackerMatchName))
        {
            alert(localize("$$$/AE/Script/VR/CameraTrackerMissingAlert=Error: 3D Camera Tracker not available."));
            return false;
        }
    
        /* Reset camera orientation - only front view tracking is currently supported */
        
        //var skyboxNullController = destComp.layer(kMasterNullParentName);
        var skyboxNullController = findMasterNullParentWithinItemCollection(destComp.layers);
        if(skyboxNullController!=null)
        {
            resetLayerOrientation(skyboxNullController);
        }
    
        var skyboxMasterCamera = findMasterCameraWithinItemCollection(destComp.layers);
        if(skyboxMasterCamera!=null)
        {
            resetLayerOrientation(skyboxMasterCamera);
        }
    
        /* Apply tracker */
        
        var trackerEffect = viewerLayer.effect.addProperty(kAdobeTrackerMatchName);
        
        var horizontalFOVDegrees = (180/kPI) * (2*Math.atan(destComp.width / (2*destComp.activeCamera.zoom.value)));
        
        trackerEffect.property(3).setValue(4);
        trackerEffect.property(4).setValue(horizontalFOVDegrees);
        
        /* Select viewrLayer to make it easier for user to find Adobe Camera Tracker settings */
        
        for(var i = 1; i<destComp.layers.length; i++)
        {
            var curItem = destComp.layers[i];
            curItem.selected = false;
        }
        viewerLayer.selected = true;
    
        return true;
    }

    function setupTrackerCameraFor3D(destComp, trackerCamera, toggle)
    {
        if(trackerCamera==null)
        {
            alert(localize("$$$/AE/Script/VR/CantFindTrackerCameraAlert=Error: Can't find tracker camera."));
            return false;
        }
        
        var viewerLayer = findViewerLayerInComp(destComp);
        
        /* Set expressions to compensate 3D Tracker Camera orientation change
            * First - compensate Viewer in Edit precomp
            */
        
        var precompComp = viewerLayer.source;
        if(precompComp instanceof CompItem)
        {
            var viewerEffect = null;
            for(var layer_i=1; layer_i<=precompComp.layers.length; layer_i++)
            {
                var curLayer = precompComp.layers[layer_i];
                if(curLayer instanceof AVLayer && curLayer.effect.property(kViewerPluginMatchName)!=null) 
                {
                    viewerLayer = curLayer;
                    viewerEffect = curLayer.effect.property(kViewerPluginMatchName);
                    break;
                }
            }

            if(viewerEffect!=null)
            {
                if(toggle)
                {
                    viewerEffect.property(kEffectViewerPropertyRotateXID).expression = ("try{var trackerCamera = comp('" + destComp.name + "').layer('" + trackerCamera.name + "'); trackerCamera.orientation[0];}catch(e){value;}");
                    viewerEffect.property(kEffectViewerPropertyRotateYID).expression = ("try{var trackerCamera = comp('" + destComp.name + "').layer('" + trackerCamera.name + "'); trackerCamera.orientation[1];}catch(e){value;}");
                    viewerEffect.property(kEffectViewerPropertyRotateZID).expression = ("try{var trackerCamera = comp('" + destComp.name + "').layer('" + trackerCamera.name + "'); trackerCamera.orientation[2];}catch(e){value;}");
                    viewerEffect.property(kEffectViewerPropertyRotateInvertID).expression = ("true");
                }
                else
                {
                    viewerEffect.property(kEffectViewerPropertyRotateXID).expressionEnabled = false;
                    viewerEffect.property(kEffectViewerPropertyRotateYID).expressionEnabled = false;
                    viewerEffect.property(kEffectViewerPropertyRotateZID).expressionEnabled = false;
                    viewerEffect.property(kEffectViewerPropertyRotateInvertID).expressionEnabled = false;
                }
            }
        }

        /* Second - compensate Converter output */

        // locate any 3D version of the output comp
        // basically, is there a 3D comp of the same name?    The original format is " (3D) (SkyBox?? Output)"  Where output can be localized
        var generatorCompNameRoot = generatorOutputCompNameForEditCompName(destComp.name); // add the " (3D)" suffix
        var generatorOutputComp = findOutputCompForMasterCompName(generatorCompNameRoot,app.project.items);
        if(generatorOutputComp!=null)
        {
            // ...and then in that 3D comp of the same name, is there a Converter layer with the effect?  If not IGNORE update
            // Note that this layer may have comment properties
            var converterLayer = findConverterLayerInComp(generatorOutputComp);
         //   var converterLayer = generatorOutputComp.layer(kOutputConverterLayerName);
            if(converterLayer!=null && converterLayer.effect.property(kConverterPluginMatchName)!=null)
            {
                var converterEffect = converterLayer.effect.property(kConverterPluginMatchName);

                if(toggle)
                {

                    converterEffect.property(kEffectConverterPropertyTiltID).expression = ("try{var trackerCamera = comp('" + destComp.name + "').layer('" + trackerCamera.name + "'); -trackerCamera.orientation[0];}catch(e){value;}");
                    converterEffect.property(kEffectConverterPropertyPanID).expression = ("try{var trackerCamera = comp('" + destComp.name + "').layer('" + trackerCamera.name + "'); trackerCamera.orientation[1];}catch(e){value;}");
                    converterEffect.property(kEffectConverterPropertyRollID).expression = ("try{var trackerCamera = comp('" + destComp.name + "').layer('" + trackerCamera.name + "'); -trackerCamera.orientation[2];}catch(e){value;}");
                    converterEffect.property(kEffectConverterPropertyInvertRotationID).expression = ("true");
                }
                else
                {
                    converterEffect.property(kEffectConverterPropertyTiltID).expressionEnabled = false;
                    converterEffect.property(kEffectConverterPropertyPanID).expressionEnabled = false;
                    converterEffect.property(kEffectConverterPropertyRollID).expressionEnabled = false;
                    converterEffect.property(kEffectConverterPropertyInvertRotationID).expressionEnabled = false;
                }
            }
        }

        /* Parent cameras properly */

        if(toggle)
        {
            var skyboxNullController = findMasterNullParentWithinItemCollection(destComp.layers);
            var skyboxMasterCamera = findMasterCameraWithinItemCollection(destComp.layers);
            if(skyboxNullController!=null)
            {
                skyboxNullController.setParentWithJump(trackerCamera);
                resetLayerPosition(skyboxNullController);
            }
            else if(skyboxMasterCamera!=null)
            {
                skyboxMasterCamera.setParentWithJump(trackerCamera);
                resetLayerPosition(skyboxMasterCamera);
            }
        }
    
        /* Make sure SkyBox Master Camera is Active camera */
    
        trackerCamera.enabled = false;

        if(skyboxMasterCamera!=null)
        {
            skyboxMasterCamera.moveToBeginning();
        }
    
        return true;
    }

    function setupTrackerCameraForStab(destComp, trackerCamera, toggle)
    {
        if(trackerCamera==null)
        {
            alert(localize("$$$/AE/Script/VR/CantFindTrackerCameraAlert2=Error: Can't find tracker camera."));
            return false;
        }
    
        /* Create 3 null objects to invert 3D Tracker Camera rotation and parent properly */
        
        var nullXNameOriginalEnglish = "SkyBox Camera Stabilization X"; // FROZEN DO NOT LOCALIZE 
        var nullYNameOriginalEnglish = "SkyBox Camera Stabilization Y"; // FROZEN DO NOT LOCALIZE 
        var nullZNameOriginalEnglish = "SkyBox Camera Stabilization Z"; // FROZEN DO NOT LOCALIZE 
        var nullXNameCommentMarker = "[VR-StabXNull]";                     // FROZEN DO NOT LOCALIZE 
        var nullYNameCommentMarker = "[VR-StabYNull]";                  // FROZEN DO NOT LOCALIZE 
        var nullZNameCommentMarker = "[VR-StabZNull]";                  // FROZEN DO NOT LOCALIZE 
        var nullXNameLocalize = localize("$$$/AE/Script/VR/StabilizeNullX=VR Camera Stabilization X"); 
        var nullYNameLocalize = localize("$$$/AE/Script/VR/StabilizeNullY=VR Camera Stabilization Y");
        var nullZNameLocalize = localize("$$$/AE/Script/VR/StabilizeNullZ=VR Camera Stabilization Z");

        var nullX = findGenericMarkerOldEngInComp(destComp, nullXNameCommentMarker, nullXNameOriginalEnglish);
        var nullY = findGenericMarkerOldEngInComp(destComp, nullYNameCommentMarker, nullYNameOriginalEnglish);
        var nullZ = findGenericMarkerOldEngInComp(destComp, nullZNameCommentMarker, nullZNameOriginalEnglish);
        
        if(toggle)
        {
            if(nullZ==null)
                nullZ = destComp.layers.addNull();
            nullZ.name = nullZNameLocalize;
            nullZ.threeDLayer = true;
            nullZ.transform.position.setValue([0,0,0]);
            nullZ.transform.zRotation.expression = ("try{-thisComp.layer('" + trackerCamera.name + "').orientation[2];}catch(e){value;}");
            
            if(nullY==null)
                nullY = destComp.layers.addNull();
            nullY.name = nullYNameLocalize;
            nullY.threeDLayer = true;
            nullY.transform.position.setValue([0,0,0]);
            nullY.transform.yRotation.expression = ("try{-thisComp.layer('" + trackerCamera.name + "').orientation[1];}catch(e){value;}");
            
            if(nullX==null)
                nullX = destComp.layers.addNull();
            nullX.name = nullXNameLocalize;
            nullX.threeDLayer = true;
            nullX.transform.position.setValue([0,0,0]);
            nullX.transform.xRotation.expression = ("try{-thisComp.layer('" + trackerCamera.name + "').orientation[0];}catch(e){value;}");
            
            nullY.setParentWithJump(nullZ);
            nullX.setParentWithJump(nullY);

            var skyboxNullController = findMasterNullParentWithinItemCollection(destComp.layers);
            var skyboxMasterCamera = findMasterCameraWithinItemCollection(destComp.layers);
            if(skyboxNullController!=null)
            {
                skyboxNullController.setParentWithJump(nullX);
                resetLayerPosition(skyboxNullController);
            }
            else if(skyboxMasterCamera!=null)
            {
                skyboxMasterCamera.setParentWithJump(nullX);
                resetLayerPosition(skyboxMasterCamera);
            }
        }
        else
        {
            if(nullX!=null) 
                nullX.remove();
            
            if(nullY!=null) 
                nullY.remove();
            
            if(nullZ!=null) 
                nullZ.remove();
        }
    
        /* Make sure SkyBox Master Camera is Active camera */
    
        trackerCamera.enabled = false;

        if(skyboxMasterCamera!=null)
        {
            skyboxMasterCamera.moveToBeginning();
        }
    
        return true;
    }

    function deleteEditComp(outputComp, editCompIndex)
    {
         var editComp = outputComp.editComps[editCompIndex];
         if(editComp==null) return false;
                    
         var folderName = outputComp.handle.name;
         var skyboxFolder = itemByNameWithinItemCollection(folderName, "FolderItem", app.project.items);  // reasonable to expect name match?
         if(skyboxFolder==null) return false;
         
         var supportFolder = findSupportFolderWithinItemCollection(skyboxFolder.items);
         if(supportFolder==null) return false;
         
         var combinedComp = findPrecompCombinedWithinItemCollection(outputComp.skyboxTitle, supportFolder.items);
         if(combinedComp==null) return false;
         
         /* Delete output layer in combined comp */
         
         var layerName = editComp.handle.name;          // reasonable to expect layer name match because refreshed at same time?
         var editCompLayer = itemByNameWithinItemCollection(layerName, "AVLayer", combinedComp.layers);
         if(editCompLayer!=null)
         {
            editCompLayer.locked = false;
            editCompLayer.remove();
         }
            
         /* Delete precomp */
         
         var editCompOriginalIndex = getIndexPostfixForEditName(editComp.handle.name);  // parse in a way that will handle localization
        // var editCompOriginalIndex = parseInt(editComp.handle.name.charAt(editComp.handle.name.indexOf(kSkyBoxV2EditCompNamePostfixOriginalEnglish) + kSkyBoxV2EditCompNamePostfixOriginalEnglish.length));
            
         var precompComp = findPrecompEditWithinItemCollection(outputComp.skyboxTitle, editCompOriginalIndex,  supportFolder.items);
         if(precompComp!=null) 
            precompComp.remove();
         
         /* Delete 3D folder if needed */
         
         if(editComp.threeD)
         {
             var generatorOutputCompName = generatorOutputCompNameForEditCompName(editComp.handle.name);  // add the " (3D)"
             // try to locate by every possible permutation of localized names instead of tagging folders
             generatorFolder = findOutputFolderByNameLocalizeAware(generatorOutputCompName);
             if(generatorFolder!=null)
                generatorFolder.remove();
         }
         
         /* Delete Edit comp */
        
         editComp.handle.remove();    
         
         return true;
    }

    function updateReorientCamera(outputComp, editComp, reorientCamera)
    {
        var converterLayer = findConverterLayerInComp(outputComp.handle);
        if(converterLayer==null) return false;
        
        var converterEffect = converterLayer.effect.property(kConverterPluginMatchName);
        if(converterEffect==null)
        {
            converterEffect = converterLayer.effect.addProperty(kConverterPluginMatchName);
        }
        
        if(reorientCamera)
        {        
            converterEffect.property(kEffectConverterPropertyTiltID).expression = ("try{mc=comp('" + editComp.handle.name + "').activeCamera;b = Math.asin(clamp(mc.toWorldVec([0,0,1])[0],-1,1)/thisComp.pixelAspect); if (Math.abs(Math.cos(b)) > .0005) { c = -Math.atan2(mc.toWorldVec([0,1,0])[0],mc.toWorldVec([1,0,0])[0]);a = -Math.atan2(mc.toWorldVec([0,0,1])[1],mc.toWorldVec([0,0,1])[2]);} else {a = Math.atan2(mc.toWorldVec([1,0,0])[1],mc.toWorldVec([0,1,0])[1]);c = 0;}var xyz = [radiansToDegrees(a),radiansToDegrees(b),radiansToDegrees(c)];-xyz[0];}catch(e){value;}");
            converterEffect.property(kEffectConverterPropertyPanID).expression = ("try{mc=comp('" + editComp.handle.name + "').activeCamera;b = Math.asin(clamp(mc.toWorldVec([0,0,1])[0],-1,1)/thisComp.pixelAspect); if (Math.abs(Math.cos(b)) > .0005) { c = -Math.atan2(mc.toWorldVec([0,1,0])[0],mc.toWorldVec([1,0,0])[0]);a = -Math.atan2(mc.toWorldVec([0,0,1])[1],mc.toWorldVec([0,0,1])[2]);} else {a = Math.atan2(mc.toWorldVec([1,0,0])[1],mc.toWorldVec([0,1,0])[1]);c = 0;}var xyz = [radiansToDegrees(a),radiansToDegrees(b),radiansToDegrees(c)]; xyz[1];}catch(e){value;}");
            converterEffect.property(kEffectConverterPropertyRollID).expression = ("try{mc=comp('" + editComp.handle.name + "').activeCamera;b = Math.asin(clamp(mc.toWorldVec([0,0,1])[0],-1,1)/thisComp.pixelAspect); if (Math.abs(Math.cos(b)) > .0005) { c = -Math.atan2(mc.toWorldVec([0,1,0])[0],mc.toWorldVec([1,0,0])[0]);a = -Math.atan2(mc.toWorldVec([0,0,1])[1],mc.toWorldVec([0,0,1])[2]);} else {a = Math.atan2(mc.toWorldVec([1,0,0])[1],mc.toWorldVec([0,1,0])[1]);c = 0;}var xyz = [radiansToDegrees(a),radiansToDegrees(b),radiansToDegrees(c)];-xyz[2];}catch(e){value;}");
            converterEffect.property(kEffectConverterPropertyInvertRotationID).expression = ("true");
        }
        else
        {
            converterEffect.property(kEffectConverterPropertyTiltID).expressionEnabled = false;
            converterEffect.property(kEffectConverterPropertyPanID).expressionEnabled = false;
            converterEffect.property(kEffectConverterPropertyRollID).expressionEnabled = false;
            converterEffect.property(kEffectConverterPropertyInvertRotationID).expressionEnabled = false;
        }
    
        /* Make sure only one comp is reoriented */
        
        for(var i=0; i<outputComp.editComps.length; i++)
        {
            var otherEditComp = outputComp.editComps[i];
            var newCamReorientValue = (otherEditComp.handle.name==editComp.handle.name && reorientCamera);
            if(otherEditComp.camReorient!=newCamReorientValue)
            {
                var properties = compPropertiesFromTag(otherEditComp.handle.comment);
                properties.reorientCamera = newCamReorientValue;
                otherEditComp.handle.comment = compTagFromProperties(properties.isOutputComp, properties.isEditComp, properties.userGivenName, properties.isThreeD, properties.useThreeDPlugins, properties.useEdgeBlending, properties.useTwoNodeCamera, properties.useNullParent, properties.centerCamera, properties.reorientCamera, properties.srcHasAlpha);
            }
        }
        
        return true;
    }

    function runScriptPayload(ui)
    {
  
        var selectedComp = selectedCompItem(ui);
    
        /* Composer needs special handling - when no comp is selected, we should create blank skybox */
        
        var composerComp = selectedComp;
        if(script_type==METTLE_SCRIPT_TYPE.COMPOSER && composerComp==null)
        {
            /* Check whether it is implict master comp or we should create a new one */
            
            var existingOutputComp = null;
            if(ui.comp_selector.selection!=null)
            {
                existingOutputComp = findOutputCompForMasterCompName(ui.comp_selector.selection.text, app.project.items);
            }
            
            var dummyComp = {};
            if(existingOutputComp==null)
            {
                dummyComp = 
                {
                    name: nextUniqueMasterCompName(),
                    width: 4096,
                    height: 2048, // will be adjusted by Converter according to Output Format
                    pixelAspect: 1.0,
                    duration: 30,
                    frameRate: 29.97
                };
            
                var outputTuple = createSkyBoxOutputFromComp(dummyComp, false, false, METTLE_OUTPUT_FORMAT.EQUIMAP_2_1);
                selectedComp = outputTuple[1];
            }
            else
            {
                dummyComp = 
                {
                    name: ui.comp_selector.selection.text,
                    width: existingOutputComp.width,
                    height: existingOutputComp.height,
                    pixelAspect: existingOutputComp.pixelAspect,
                    duration: existingOutputComp.duration,
                    frameRate: existingOutputComp.frameRate
                };
            
                selectedComp = existingOutputComp;
            }
             
            composerComp = dummyComp;
        }
        
        /* Check that we have selected composition to process */

        if(selectedComp == null)
        {   
            alert(kPleaseSelectCompToProcess);
            return false;
        }

        /* Check that SkyBox Converter (and/or Viewer) is installed */
        
        var testLayer = selectedComp.layers.addNull();
        var isConverterPluginInstalled = testLayer.effect.canAddProperty(kConverterPluginMatchName);
        var isViewerPluginInstalled = testLayer.effect.canAddProperty(kViewerPluginMatchName);
        var isProject2DPluginInstalled = testLayer.effect.canAddProperty(kProject2DPluginMatchName);
        testLayer.remove();
        
        if(!isConverterPluginInstalled)
        {
            // shouldn't happen. expect to be installed with AE now
            alert(localize("$$$/AE/Script/VR/ConverterPluginMissingAlert=VR Converter plugin is missing."));  
            return false;
        }
        else if(script_type==METTLE_SCRIPT_TYPE.EXTRACTOR && !isViewerPluginInstalled)
        {
            // FIXME are we shipping something here? may still happen?  Wrong label?
            alert(localize("$$$/AE/Script/VR/ViewerPluginMissingAlert=VR Viewer plugin is not installed.")); 
            return false;
        }
        else if(script_type==METTLE_SCRIPT_TYPE.COMPOSER && (!isViewerPluginInstalled || !isProject2DPluginInstalled))
        {
            // project2D should be installed with AE now (removed from text)
            // FIXME but viewer may be missing?  wrong label?
            alert(localize("$$$/AE/Script/VR/ViewerPluginMissingAlert2=VR Viewer plugin is not installed."));
            return false;
        }
       
        /* Run payload */
    
        if(script_type==METTLE_SCRIPT_TYPE.CREATOR) 
        {
             /* Check if selected comp is SkyBox Output itself, select master comp in this case */
        
            var masterComp = findMasterCompForOutputComp (selectedComp);
            if(masterComp!=null) selectedComp = masterComp;
            
            generateSkyBoxFromComp(selectedComp, selectedComp.name, 0, ui.checkboxCenterCamera.value==true, ui.checkboxTwoNodeCamera.value==true, ui.checkboxNullParent.value==true, ui.checkbox3dPlugins.value==false, ui.checkboxBlending.value==true, true, true);
        }
        else if(script_type==METTLE_SCRIPT_TYPE.EXTRACTOR) 
        {
             /* Check if selected comp is SkyBox Output itself, select master comp in this case */
             
            var masterComp = findMasterCompForOutputComp (selectedComp);
            if(masterComp!=null) selectedComp = masterComp;
            
            extractSkyBoxFromComp(selectedComp, ui.quality_input.selection.index);
        }
        else if(script_type==METTLE_SCRIPT_TYPE.COMPOSER)
        {
            createSkyBoxEditFromComp(composerComp, parseInt(ui.width_input.text), ui.ratio_input.selection.index, ui.checkboxCenterCamera.value==true, ui.checkboxTwoNodeCamera.value==true, ui.checkboxNullParent.value==true, ui.threeDMode, ui.threeDMode && ui.checkbox3dPlugins.value==false, ui.threeDMode && ui.checkboxBlending.value==true, ui.threeDMode && ui.checkboxAlpha.value==true);
        }

    
        return true;
    }

    function generateSkyBoxFromComp(selectedComp, outputName, outputWidth, recenterCamera, useTwoNodeCamera, useNullParent, useCollapseTransformMethod, useEdgeBlending, reorientCamera, openOutputInViewer) // outputWidth can be 0, which means calculate optimal width
    {
        /* Find Master Camera & Null Parent or create if needed */
         
         var camTuple = createMasterCamInComp(selectedComp, recenterCamera, useTwoNodeCamera, useNullParent);
         var masterCam = camTuple[0];
         var masterNullParent = camTuple[1];
            
        /* Determine new SkyBox name (based on comp name). Only one SkyBox per composition is allowed (duplicates not needed), so previous setup will be refreshed if exists */
        
         var folderName = outputCompNameFromNameLocalizeVersionAware(outputName);
         var skyboxFolder = findOutputFolderByNameLocalizeAware(outputName);
         if(skyboxFolder==null) skyboxFolder = app.project.items.addFolder(folderName);
         
         var supportFolder = findSupportFolderWithinItemCollection( skyboxFolder.items);
         if (supportFolder == null) {
             supportFolder = skyboxFolder.items.addFolder(kSupportFolderNameLocalize);
             supportFolder.comment = kSupportFolderNameCommentMarker;
         }
        
         /* Create separate comps with precomposed master, apply own camera to each comp, save comps into separate folder */
        
        var cameraZoom = selectedComp.height / 2; // this is equivalent to 90 degrees vertical field of view in After Effects
        var previousMasterCamLockStatus = masterCam.locked;
        masterCam.locked = false;
        masterCam.zoom.setValue(cameraZoom); // make sure current Master Cam has correct zoom value
        
        var cam_comp_width = selectedComp.width;
        var cam_comp_height = selectedComp.height;
        
        var cam_comps = [];
        for(var cam_comp_i=6; cam_comp_i>=1; cam_comp_i--) // Order is reversed because we want cameras to appear in comp window in a correct order (the last one added will be the topmost)
        {
            //var camCompName = compNameWithPostfix(outputName, "cam" + cam_comp_i + "-" + kCameraNamesPostfixOriginalEnglish[cam_comp_i - 1]);  
            // NOTE: the camComp name has a user provided portion and a localized portion
            // but because of the localized portion we cannot use the entire name for comp identity
            // So, we calc the user visible (partially) localized name, but search on a combination of
            // the name _partially_ matching + the proper comment tag  (findCameraCompWithinItemCollection)
            var camCompName = outputName + kCameraCompNamesSuffixLocalizeA[cam_comp_i - 1];  // Localized label NOT for identity!

            var camComp = findCameraCompWithinItemCollection(outputName, app.project.items, cam_comp_i);
            if(camComp!=null) // delete previous cam comp (it's easier than resetup size and stuff)
            {
                camComp.remove();   // note this removes any previous tags that might exist. cam comps don't apparently use that
                camComp = null;
            }
            
            if(!useCollapseTransformMethod) // duplicate comps - works with AE native 3d and third party 3d plugins
            {
                var dupComp = selectedComp.duplicate();
                dupComp.parentFolder = supportFolder;
                dupComp.name = camCompName;
                dupComp.comment = kCameraCompCommentMarkerA[cam_comp_i - 1]; // marks the camera comp type for later find

                /* Delete viewer layer (created by SkyBox Composer only) */
                
                var viewerLayer = findViewerLayerInComp(dupComp);
                if(viewerLayer!=null) viewerLayer.remove();
                
                 /* Delete all cameras and lock other layers */
            
                var oldCameras = [];
                for(var layer_i=1; layer_i<=dupComp.layers.length; layer_i++)
                {
                    var curLayer = dupComp.layers[layer_i];
                    if(curLayer instanceof CameraLayer) 
                        oldCameras.push(curLayer);
                    else curLayer.locked = true;
                }

                for(var i=0; i<oldCameras.length; i++)
                {
                    oldCameras[i].locked = false;
                    oldCameras[i].remove();
                }
                    
                camComp = dupComp;
            }
            else // use precomps with Collapse Transformations applied (works only with AE native 3d)
            {
                camComp = app.project.items.addComp(camCompName, cam_comp_width, cam_comp_height, selectedComp.pixelAspect, selectedComp.duration, selectedComp.frameRate);     // camera comp
                camComp.parentFolder = supportFolder;
                camComp.comment = kCameraCompCommentMarkerA[cam_comp_i - 1]; // marks the camera comp type for later find

                var layer = camComp.layers.add(selectedComp);
                layer.collapseTransformation = true; // it's important to set this flag, it makes precomp to be treated as a 3d layer and camera is applied correctly
                layer.locked = true;
                
                /* Need to copy lights manually, because Collapse Transformation doesn't honor lights */
                
                for(var layer_i=1; layer_i<=selectedComp.layers.length; layer_i++)
                {
                    var curLayer = selectedComp.layers[layer_i];
                    if(curLayer instanceof LightLayer && curLayer.parent==null) // avoid copying layers with parent - causes AE crash 
                    {
                        curLayer.copyToComp(camComp);
                    }
                }
            }    
           
            /* Add camera to the Master Comp, set it as a child of a Master Cam, replicate the camera to the current cam comp */
            
            var compCenter = [camComp.width/2, camComp.height/2, 0];
           // var camLayerName = "SkyBox Camera" + " " + cam_comp_i + " " + "(" + kCameraNamesPostfixOriginalEnglish[cam_comp_i - 1] + ")";   
            
            /*
            var cameraInMaster = itemByNameWithinItemCollection(camLayerName, "CameraLayer", selectedComp.layers);
            if(cameraInMaster==null)
                cameraInMaster = selectedComp.layers.addCamera(camLayerName, [0,0]);
            cameraInMaster.locked = false;
            cameraInMaster.enabled = false;
            cameraInMaster.setParentWithJump(masterCam);
            cameraInMaster.autoOrient = masterCam.autoOrient;
            cameraInMaster.transform.position.setValue([0,0,0]);
            cameraInMaster.property(camera_rotation_axis[cam_comp_i-1]).setValue(camera_rotation_angles[cam_comp_i-1]);
            if(masterCam.autoOrient!=AutoOrientType.NO_AUTO_ORIENT) cameraInMaster.transform.pointOfInterest.setValue([0,0,0]); // POI applies only to two-node cameras
            */
        
            var camera = camComp.layers.addCamera(kCameraLayerNamesLocalizeA[cam_comp_i - 1], [0, 0]);
            camera.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
            //    camera.property(camera_rotation_axis[cam_comp_i - 1]).setValue(camera_rotation_angles[cam_comp_i - 1]);
            setTransformRotationByFaceIndex(camera.transform, cam_comp_i);
            camera.comment = kCameraLayerCommentMarkerA[cam_comp_i - 1];  // not used?
            
            // The master camera layer (mc) is found via a none-localized marker in the comment field
            // if this is not present, fall back to the old english specific camera name (old skybox projects)
            var lyrex = "cmp = comp('"+selectedComp.name+"');";
            lyrex = lyrex + "mc=null;try{mc = cmp.layerByComment('" + kMasterCameraCommentMarker + "');}catch(e){mc = cmp.layer('" + kMasterCameraNameOriginalEnglish + "');}";

            camera.transform.position.expression = ("try{"+lyrex+"mc.toWorld([0,0,0]);}catch(e){value;}");
            if(reorientCamera)
                camera.transform.orientation.expression = ("try{ "+lyrex+";b = Math.asin(clamp(mc.toWorldVec([0,0,1])[0],-1,1)/thisComp.pixelAspect); if (Math.abs(Math.cos(b)) > .0005) {c = -Math.atan2(mc.toWorldVec([0,1,0])[0],mc.toWorldVec([1,0,0])[0]);a = -Math.atan2(mc.toWorldVec([0,0,1])[1],mc.toWorldVec([0,0,1])[2]);} else {a = Math.atan2(mc.toWorldVec([1,0,0])[1],mc.toWorldVec([0,1,0])[1]);c = 0;}[radiansToDegrees(a),radiansToDegrees(b),radiansToDegrees(c)];}catch(e){value;}");
            else
                camera.transform.orientation.expression = ("[0,0,0]");
             
            /* Link camera properties to Master Camera */
            
            camera.cameraOption.zoom.expression =  ""+lyrex+"mc.cameraOption.zoom";            
            camera.cameraOption.depthOfField.expression =  ""+lyrex+"mc.cameraOption.depthOfField";
            camera.cameraOption.focusDistance.expression =  ""+lyrex+"mc.cameraOption.focusDistance";
            camera.cameraOption.aperture.expression =  ""+lyrex+"mc.cameraOption.aperture";
            camera.cameraOption.blurLevel.expression =  ""+lyrex+"mc.cameraOption.blurLevel";
            camera.cameraOption("ADBE Iris Shape").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Shape')";
            camera.cameraOption("ADBE Iris Rotation").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Rotation')";
            camera.cameraOption("ADBE Iris Roundness").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Roundness')";
            camera.cameraOption("ADBE Iris Aspect Ratio").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Aspect Ratio')";
            camera.cameraOption("ADBE Iris Diffraction Fringe").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Diffraction Fringe')";
            camera.cameraOption("ADBE Iris Highlight Gain").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Highlight Gain')";
            camera.cameraOption("ADBE Iris Highlight Threshold").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Highlight Threshold')";
            camera.cameraOption("ADBE Iris Hightlight Saturation").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Hightlight Saturation')";
            
            
            if(useEdgeBlending)
            {
                var fov100 = Math.round(camComp.height / (2 * kTan50));
                
                camera.zoom.expressionEnabled = false;
                camera.zoom.setValue(fov100);
            }
        
            //cameraInMaster.locked = true;
            camera.locked = true;
        
            cam_comps[cam_comp_i] = camComp;
        }

        masterCam.moveToBeginning(); // make sure Master Camera has top position among secondary cams
        if(useNullParent) masterNullParent.moveToBeginning();
        
        masterCam.locked = previousMasterCamLockStatus;
        
        /* Create combined comp with views from 6 cameras. Refresh if exists. */
        
        var cam_comp_square_size = cam_comp_height; // in order to build a cube map, we need square projection, so we will trim comp on left and right if needed, thus we assume that comp height is always equal or less than comp width
        
        var combined_width = cam_comp_square_size*3;    // was 4:3
        var combined_height = cam_comp_square_size*2;
        
        if(useEdgeBlending)
        {
            var blend_margin_vertical = cam_comp_height*kOneMinusTan40/2;
            var camp_comp_effective_size = cam_comp_square_size - 2 * blend_margin_vertical;

            // FUTURE3:2
            //combined_width = Math.round(camp_comp_effective_size*3);    // was 4:3
            // combined_height = Math.round(camp_comp_effective_size*2);
            combined_width = Math.round(camp_comp_effective_size * 4);
            combined_height = Math.round(camp_comp_effective_size * 3);
        }

        var combinedComp = findCombinedCompWithinItemCollection(outputName,  supportFolder.items);
        if(combinedComp==null)
        {
            /* Crate new combined composition and put it inside the folder */
            
            combinedComp = app.project.items.addComp(combinedCompNameFromNameLocal(outputName), combined_width, combined_height, selectedComp.pixelAspect, selectedComp.duration, selectedComp.frameRate);  // combined from output comp
            combinedComp.parentFolder = supportFolder;
            combinedComp.comment = kCombinedCompNameCommentMarker;
        }
        else 
        {
            /* Delete all previous layers because previosly referenced cam comps were recreated */
            
            var oldLayers = [];
            for(var layer_i=1; layer_i<=combinedComp.layers.length; layer_i++)
                oldLayers.push(combinedComp.layers[layer_i]);

            for(var i=0; i<oldLayers.length; i++)
            {
                oldLayers[i].locked = false;
                oldLayers[i].remove();
            }
                
            /* Update size (in case it was changed) */
                
            combinedComp.width = combined_width;
            combinedComp.height = combined_height;
        }
        
        // the new 32 version (not used by blending yet)
        function CombinedLayerOffsetValue(faceX, faceY, combinedComp) { // base-0
            var faces_wide = 3;
            var faces_tall = 2;
            return [(faceX * 2 + 1) / (faces_wide * 2) * combinedComp.width, (faceY * 2 + 1) / (faces_tall * 2) * combinedComp.height];
        }

        // Faces have a 4:3 version (blend) and a 3:2 version (none-blend)
        // Blending for masks is only the original 4:3 for now
        var total_combined_layers = 6;
        var use32CubeMap = true;
        if (useEdgeBlending) {
            total_combined_layers = 20;
            use32CubeMap = false;
        }
        var combined_layers = [];
        for(var i=1; i<=total_combined_layers; i++)
        {
            /* Create and position layer properly */
            
            var layer = null;

            // this is the new 3:2 layout, used by none-blending
            if (use32CubeMap) {
                switch (i) {
                    case 1: // front
                        layer = combinedComp.layers.add(cam_comps[i]);
                        layer.transform.position.setValue(CombinedLayerOffsetValue(0, 0, combinedComp));
                        break;

                    case 2: // right
                        layer = combinedComp.layers.add(cam_comps[i]);
                        layer.transform.position.setValue(CombinedLayerOffsetValue(1, 0, combinedComp));
                        break;

                    case 3: // back
                        layer = combinedComp.layers.add(cam_comps[i]);
                        layer.transform.position.setValue(CombinedLayerOffsetValue(2, 0, combinedComp));
                        break;

                    case 4: // left
                        layer = combinedComp.layers.add(cam_comps[i]);
                        layer.transform.position.setValue(CombinedLayerOffsetValue(0, 1, combinedComp));
                        break;

                    case 5: // top
                        layer = combinedComp.layers.add(cam_comps[i]);
                        layer.transform.position.setValue(CombinedLayerOffsetValue(1, 1, combinedComp));
                        break;

                    case 6: // bottom
                        layer = combinedComp.layers.add(cam_comps[i]);
                        layer.transform.position.setValue(CombinedLayerOffsetValue(2, 1, combinedComp));
                        break;

                }
            } else {

                // this is the original 4:3 layout, used by blending only
                switch (i) {
                    case 1: // front
                        layer = combinedComp.layers.add(cam_comps[i]);
                        layer.transform.position.setValue([3 / 8 * combinedComp.width, 3 / 6 * combinedComp.height]);
                        break;

                    case 2: // right
                        layer = combinedComp.layers.add(cam_comps[i]);
                        layer.transform.position.setValue([5 / 8 * combinedComp.width, 3 / 6 * combinedComp.height]);
                        break;

                    case 3: // back
                        layer = combinedComp.layers.add(cam_comps[i]);
                        layer.transform.position.setValue([7 / 8 * combinedComp.width, 3 / 6 * combinedComp.height]);
                        break;

                    case 4: // left
                        layer = combinedComp.layers.add(cam_comps[i]);
                        layer.transform.position.setValue([1 / 8 * combinedComp.width, 3 / 6 * combinedComp.height]);
                        break;

                    case 5: // top
                        layer = combinedComp.layers.add(cam_comps[i]);
                        layer.transform.position.setValue([3 / 8 * combinedComp.width, 1 / 6 * combinedComp.height]);
                        break;

                    case 6: // bottom
                        layer = combinedComp.layers.add(cam_comps[i]);
                        layer.transform.position.setValue([3 / 8 * combinedComp.width, 5 / 6 * combinedComp.height]);
                        break;

                    case 7: // left-top
                        layer = combinedComp.layers.add(cam_comps[4]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([1 / 8 * combinedComp.width, 1 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(90);
                        break;

                    case 8: // top-left
                        layer = combinedComp.layers.add(cam_comps[5]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([1 / 8 * combinedComp.width, 1 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(-90);
                        break;

                    case 9: // top-right
                        layer = combinedComp.layers.add(cam_comps[5]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([5 / 8 * combinedComp.width, 1 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(90);
                        break;

                    case 10: // right-top
                        layer = combinedComp.layers.add(cam_comps[2]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([5 / 8 * combinedComp.width, 1 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(-90);
                        break;

                    case 11: // right-bottom
                        layer = combinedComp.layers.add(cam_comps[2]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([5 / 8 * combinedComp.width, 5 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(90);
                        break;

                    case 12: // bottom-right
                        layer = combinedComp.layers.add(cam_comps[6]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([5 / 8 * combinedComp.width, 5 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(-90);
                        break;

                    case 13: // bottom-left
                        layer = combinedComp.layers.add(cam_comps[6]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([1 / 8 * combinedComp.width, 5 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(90);
                        break;

                    case 14: // left-bottom
                        layer = combinedComp.layers.add(cam_comps[4]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([1 / 8 * combinedComp.width, 5 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(-90);
                        break;

                    case 15: // top-back
                        layer = combinedComp.layers.add(cam_comps[5]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([7 / 8 * combinedComp.width, 1 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(180);
                        break;

                    case 16: // back-top
                        layer = combinedComp.layers.add(cam_comps[3]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([3 / 8 * combinedComp.width, -1 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(-180);
                        break;

                    case 17: // back-bottom
                        layer = combinedComp.layers.add(cam_comps[3]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([3 / 8 * combinedComp.width, 7 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(180);
                        break;

                    case 18: // bottom-back
                        layer = combinedComp.layers.add(cam_comps[6]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([7 / 8 * combinedComp.width, 5 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(-180);
                        break;

                    case 19: // back-left
                        layer = combinedComp.layers.add(cam_comps[3]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([-1 / 8 * combinedComp.width, 3 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(0);
                        break;

                    case 20: // left-back
                        layer = combinedComp.layers.add(cam_comps[4]);
                        layer.name = "_blending" + i;
                        layer.transform.position.setValue([9 / 8 * combinedComp.width, 3 / 6 * combinedComp.height]);
                        layer.transform.rotation.setValue(0);
                        break;
                }
            }
        
            /* Apply mask to make it square projection, if needed */
            
            if(cam_comp_width!=cam_comp_height)
            {
                var square_correction_x_offset = (cam_comp_width - cam_comp_height) / 2;
                
                var squareMaskShape = new Shape(); 
                squareMaskShape.vertices = [[square_correction_x_offset,0], [square_correction_x_offset,cam_comp_height], [cam_comp_width-square_correction_x_offset,cam_comp_height], [cam_comp_width-square_correction_x_offset,0]]; 
                squareMaskShape.closed = true;
                
                var squareMaskProperty = layer.mask.addProperty("ADBE Mask Atom");
                squareMaskProperty.property("ADBE Mask Shape").setValue(squareMaskShape);
            }
            
            layer.locked = true;
            combined_layers[i] = layer;
        }

        /* Create output comp to apply Converter on, it will include precomposed combined comp. Refresh if exists. */

        var outputCompName = folderName;    // if created, localized name
        var countFacesHoriz = use32CubeMap ? 3 : 4; // original was 4
        if (outputWidth == 0) outputWidth = cam_comp_square_size * countFacesHoriz; // use default if not set

        var inputIDValue = use32CubeMap ? 7 : 2; // original was for 4:3 cubemap
        var outputComp = findOutputCompForMasterCompName(outputName, skyboxFolder.items);
        if (outputComp == null)
        {
            /* Create new output composition and precompose combined comp into it */
            
            outputComp  = app.project.items.addComp(outputCompName, combined_width, combined_height, selectedComp.pixelAspect, selectedComp.duration, selectedComp.frameRate);  // output comp  (generate skybox)
            outputComp.parentFolder = skyboxFolder;
            outputComp.comment = compTagFromProperties(true, false, outputCompName, false, false, false, false, false, false, false, false);

            var outputLayer = outputComp.layers.add(combinedComp);
            outputLayer.name = kConverterLayerNameLocalize;
            outputLayer.comment = kConverterLayerNameCommentMarker;  // sets as converter layer in output comp
            
            outputLayer.effect.addProperty(kConverterPluginMatchName);
            outputLayer.effect.property(kConverterPluginMatchName).property(kEffectConverterPropertyInputID).setValue(inputIDValue);
            outputLayer.effect.property(kConverterPluginMatchName).property(kEffectConverterPropertyOutputID).setValue(3);
            outputLayer.effect.property(kConverterPluginMatchName).property(kEffectConverterPropertyOutputWidthID).setValue(outputWidth);
        } else {
            // comp exists, but need to make sure converter gets updated to match since can need upgrade from 4:3 or change b/c of blending mode (still 4:3)
            var outputLayer = findConverterLayerInComp(outputComp);
            if (outputLayer) {
                outputLayer.effect.property(kConverterPluginMatchName).property(kEffectConverterPropertyInputID).setValue(inputIDValue);
            }
        }

        var blendingAdjustmentLayer = findBlendingAdjustmentWithinItemCollection(selectedComp.layers);

        if (useEdgeBlending)
        {
            if(blendingAdjustmentLayer==null)
            {
                blendingAdjustmentLayer = selectedComp.layers.addSolid([1, 1, 1], kBlendingAdjustmentLayerNameLocalize, selectedComp.width, selectedComp.height, selectedComp.pixelAspect);
                blendingAdjustmentLayer.adjustmentLayer = true;
                blendingAdjustmentLayer.comment = kBlendingAdjustmentLayerNameCommentMarker;
            }
            
             /* Add blending controls if needed */
                                
            var square_correction_x_offset = (cam_comp_width - cam_comp_height) / 2;
            
            var blend_margin_v = Math.round(cam_comp_height*kOneMinusTan40/2);
            var blend_margin_h = square_correction_x_offset + blend_margin_vertical;
            
            // NOTE: Presumption only two controls and in this order for localization
            var blendingFeather = null;
            try { blendingFeather = blendingAdjustmentLayer.effect(kBlendingFeatherEffectIndex); } catch (e) { }
            if(blendingFeather == null)
            {
                blendingFeather = blendingAdjustmentLayer.effect.addProperty("ADBE Slider Control");
                blendingFeather.name = kBlendingFeatherControlNameLocalize;
                blendingAdjustmentLayer.effect(kBlendingFeatherEffectIndex).property(1).setValue(blend_margin_v);
            }
            
            // NOTE: Presumption only two controls and in this order for localization
            var blendingExpansion = null;
            try {  blendingExpansion = blendingAdjustmentLayer.effect(kBlendingExpansionEffectIndex); } catch(e) {}
            if(blendingExpansion == null)
            {
                blendingExpansion = blendingAdjustmentLayer.effect.addProperty("ADBE Slider Control");
                blendingExpansion.name = kBlendingExpansionControlNameLocalize;
                blendingAdjustmentLayer.effect(kBlendingExpansionEffectIndex).property(1).setValue(blend_margin_v / 2); // empirical value
            }
        
            /* Tie controls to mask settings by expressions, create masks first */
            
            for(var i=1; i<=total_combined_layers; i++)
            {
                var layer = combined_layers[i];
                layer.locked = false;
                         
                /* Appy mask with a feather */
        
                var maskShape = new Shape(); 
                maskShape.vertices = [[blend_margin_h,blend_margin_v], [blend_margin_h,cam_comp_height-blend_margin_v], [cam_comp_width-blend_margin_h,cam_comp_height-blend_margin_v], [cam_comp_width-blend_margin_h,blend_margin_v]]; 
                maskShape.closed = true;
                
                var maskProperty = layer.mask.addProperty("ADBE Mask Atom");
                maskProperty.maskMode = MaskMode.INTERSECT;
                maskProperty.property("ADBE Mask Shape").setValue(maskShape);

                // NOTE: dependency on feather/expansion order for localization. Ideally would have marker for effect to search for
                maskProperty.property("ADBE Mask Offset").expression = "cmp = comp('" + selectedComp.name + "');lyr=null;try{lyr = cmp.layerByComment('" + kBlendingAdjustmentLayerNameCommentMarker + "');}catch(e){lyr = cmp.layer('" + kBlendingAdjustmentLayerNameOriginalEnglish + "');};lyr.effect(" + kBlendingExpansionEffectIndex + ").param(1)";
                maskProperty.property("ADBE Mask Feather").expression = "cmp = comp('" + selectedComp.name + "');lyr=null;try{lyr = cmp.layerByComment('" + kBlendingAdjustmentLayerNameCommentMarker + "');}catch(e){lyr = cmp.layer('" + kBlendingAdjustmentLayerNameOriginalEnglish + "');};feather = lyr.effect(" + kBlendingFeatherEffectIndex + ").param(1);[feather, feather]";

                /* Add additonal mask for secondary blening comps (the onese that blend left-top, top-right, etc.) */
 
                var mask2_vertices = null;
                if (i==7) mask2_vertices = [[blend_margin_h,0], [blend_margin_h,blend_margin_v], [cam_comp_width-blend_margin_h,blend_margin_v], [cam_comp_width-blend_margin_h,0]]; // left-top
                else if (i==8) mask2_vertices = [[0,blend_margin_v], [0,cam_comp_height-blend_margin_v], [blend_margin_h,cam_comp_height-blend_margin_v], [blend_margin_h,blend_margin_v]]; // top-left
                else if (i==9) mask2_vertices = [[cam_comp_width-blend_margin_h,blend_margin_v], [cam_comp_width-blend_margin_h,cam_comp_height-blend_margin_v], [cam_comp_width,cam_comp_height-blend_margin_v], [cam_comp_width,blend_margin_v]]; //top-right
                else if (i==10) mask2_vertices = [[blend_margin_h,0], [blend_margin_h,blend_margin_v], [cam_comp_width-blend_margin_h,blend_margin_v], [cam_comp_width-blend_margin_h,0]]; // right-top               
                else if (i==11) mask2_vertices = [[blend_margin_h,cam_comp_height-blend_margin_v], [blend_margin_h,cam_comp_height], [cam_comp_width-blend_margin_h,cam_comp_height], [cam_comp_width-blend_margin_h,cam_comp_height-blend_margin_v]]; // rigth-bottom
                else if (i==12) mask2_vertices = [[cam_comp_width-blend_margin_h,blend_margin_v], [cam_comp_width-blend_margin_h,cam_comp_height-blend_margin_v], [cam_comp_width,cam_comp_height-blend_margin_v], [cam_comp_width,blend_margin_v]]; // bottom-right
                else if (i==13) mask2_vertices = [[0,blend_margin_v], [0,cam_comp_height-blend_margin_v], [blend_margin_h,cam_comp_height-blend_margin_v], [blend_margin_h,blend_margin_v]]; // bottom-left
                else if (i==14) mask2_vertices = [[blend_margin_h,cam_comp_height-blend_margin_v], [blend_margin_h,cam_comp_height], [cam_comp_width-blend_margin_h,cam_comp_height], [cam_comp_width-blend_margin_h,cam_comp_height-blend_margin_v]]; // left-bottom
                else if (i==15) mask2_vertices = [[blend_margin_h,0], [blend_margin_h,blend_margin_v], [cam_comp_width-blend_margin_h,blend_margin_v], [cam_comp_width-blend_margin_h,0]]; // top-back               
                else if (i==16) mask2_vertices = [[blend_margin_h,0], [blend_margin_h,blend_margin_v], [cam_comp_width-blend_margin_h,blend_margin_v], [cam_comp_width-blend_margin_h,0]]; // back-top               
                else if (i==17) mask2_vertices = [[blend_margin_h,cam_comp_height-blend_margin_v], [blend_margin_h,cam_comp_height], [cam_comp_width-blend_margin_h,cam_comp_height], [cam_comp_width-blend_margin_h,cam_comp_height-blend_margin_v]]; // back-bottom
                else if (i==18) mask2_vertices = [[blend_margin_h,cam_comp_height-blend_margin_v], [blend_margin_h,cam_comp_height], [cam_comp_width-blend_margin_h,cam_comp_height], [cam_comp_width-blend_margin_h,cam_comp_height-blend_margin_v]]; // bottom-back
                else if (i==19) mask2_vertices = [[cam_comp_width-blend_margin_h,blend_margin_v], [cam_comp_width-blend_margin_h,cam_comp_height-blend_margin_v], [cam_comp_width,cam_comp_height-blend_margin_v], [cam_comp_width,blend_margin_v]]; //back-left
                else if (i==20) mask2_vertices = [[0,blend_margin_v], [0,cam_comp_height-blend_margin_v], [blend_margin_h,cam_comp_height-blend_margin_v], [blend_margin_h,blend_margin_v]]; // left-back
                
                if(mask2_vertices!=null)
                {
                    maskShape.vertices = mask2_vertices; 
                    maskShape.closed = true;
                
                    var mask2Property = layer.mask.addProperty("ADBE Mask Atom");
                    mask2Property.maskMode = MaskMode.INTERSECT;
                    mask2Property.property("ADBE Mask Shape").setValue(maskShape);
                }
                
                layer.locked = true;
            }
        }
        else
        {
            if(blendingAdjustmentLayer!=null)
                blendingAdjustmentLayer.remove();
        }
        
        if(openOutputInViewer)
            outputComp.openInViewer();
    }

    function extractSkyBoxFromComp(selectedComp, quality)
    {
        var use32CubeMap = true;
        if (skyboxPanel.checkboxBlending.value == true) {
            use32CubeMap = false;
        }

        /* Determine new SkyBox name (based on comp name). Only one SkyBox per composition is allowed (duplicates not needed), so previous setup will be refreshed if exists */
        
        var folderName = outputCompNameFromNameLocalizeVersionAware(selectedComp.name);
        var skyboxFolder = findOutputFolderByNameLocalizeAware(selectedComp.name);

         if(skyboxFolder==null) skyboxFolder = app.project.items.addFolder(folderName);
          
         var supportFolder = findSupportFolderWithinItemCollection(skyboxFolder.items);
         if (supportFolder == null) {
             supportFolder = skyboxFolder.items.addFolder(kSupportFolderNameLocalize);
             supportFolder.comment = kSupportFolderNameCommentMarker;
         }
         
         /* 1. Precomp selected footage into separate comp and apply Converter */
         
         var conversionComp = findConversionCompWithinItemCollection(selectedComp.name, supportFolder.items);
         if(conversionComp==null) 
         {
             var conversionCompNameLocal = compNameWithPostfix(selectedComp.name, kConversionCompNameLocalize);
             conversionComp = app.project.items.addComp(conversionCompNameLocal, selectedComp.width, selectedComp.height, selectedComp.pixelAspect, selectedComp.duration, selectedComp.frameRate);  // convversion comp
             conversionComp.parentFolder = supportFolder;
             conversionComp.comment = kConversionCompNameCommentMarker;
         }
         
         var layer = findConverterLayerInComp(conversionComp);
         if(layer==null)
         {
            layer = conversionComp.layers.add(selectedComp);
            layer.name = kConverterLayerNameLocalize;
            layer.comment = kConverterLayerNameCommentMarker;    // this historically was NOT set, but doing this for consistent handling since AE15.0
         }
     
        layer.locked = false;
        
        var converterEffect = layer.effect.property(kConverterPluginMatchName);
        if(converterEffect==null)
        {
            converterEffect = layer.effect.addProperty(kConverterPluginMatchName);
            converterEffect.property(kEffectConverterPropertyInputID).setValue(4);
        }
        var outputIDValue = use32CubeMap ? 6 : 1;  // originally 4:3
        converterEffect.property(kEffectConverterPropertyOutputID).setValue(outputIDValue);     // was 1. always update because of old 4:3 cases that need to be upgraded
     
        var cubeMapWidthMultiplier = 1;
        if(quality==METTLE_EXTRACTOR_QUALITY.LOW) cubeMapWidthMultiplier = 1;
        else if(quality==METTLE_EXTRACTOR_QUALITY.MEDIUM) cubeMapWidthMultiplier = 2;
        else if(quality==METTLE_EXTRACTOR_QUALITY.HIGH) cubeMapWidthMultiplier = 3;
        else if(quality==METTLE_EXTRACTOR_QUALITY.ULTRA) cubeMapWidthMultiplier = 4;
        
        var convertedCubeMapWidth = selectedComp.width * cubeMapWidthMultiplier;
        if (use32CubeMap) {
            convertedCubeMapWidth = convertedCubeMapWidth * 3 / 4;  // can be smaller when 3:2
        }

         converterEffect.property(kEffectConverterPropertyOutputWidthID).setValue(convertedCubeMapWidth);
        
         layer.locked = true;
            
         /* 
             * 2. Create output comp with 6 cube faces made of coverted cube-map
             *     Output comp size should be the size of one cube face (to have 1 to 1 mapping)
             */
         
         var countFacesWide = use32CubeMap ? 3 : 4;
         var cube_face_size = Math.round(convertedCubeMapWidth / countFacesWide);
         
         var editCompName = selectedComp.name + " (" + kSkyBoxV1EditCompNamePostfixLocalize + ")"; // only a single one in the folder
        // var editComp = itemByNameWithinItemCollection(editCompName, "CompItem", skyboxFolder.items);
         var editComp =  findEditCompWithinItemCollection(selectedComp.name, kSkyboxVersionV1, 0, skyboxFolder.items);
         if(editComp==null)
         {
            editComp  = app.project.items.addComp(editCompName, cube_face_size, cube_face_size, selectedComp.pixelAspect, selectedComp.duration, selectedComp.frameRate);       // edit comp
            editComp.parentFolder = skyboxFolder;

             // v1 didn't used to have a tag, but for new Adobe version for consistency we are
             // at the moment no properties but the type are tracked/used
             // were v1 properties were at the output level?
            editComp.comment = compTagFromProperties(false, true, "", false, false, false, false, false, false, false, false);
         }
         else
         {
             editComp.width = cube_face_size;
             editComp.height = cube_face_size;
         }
        
         for(var face_i=6; face_i>=1; face_i--)  // Order is reversed because we want cameras to appear in comp window in a correct order (the last one added will be the topmost)
         {
             var compCenter = [editComp.width / 2, editComp.height / 2, 0];
             var faceLayer = findExtractFaceLayerWithinItemCollection(face_i, editComp.layers);
             if(faceLayer==null) 
             {
                 /* Create new Face layer */
            
                 faceLayer = editComp.layers.add(conversionComp);
                 faceLayer.threeDLayer = true;
                 faceLayer.blendingMode = BlendingMode.ALPHA_ADD; // eliminates seam between faces
                 faceLayer.name = kFaceLayerNamesLocalizeA[face_i - 1];   // user friendly name, not used for identity
                 faceLayer.comment = kFaceLayerCommentMarkerA[face_i - 1];  // command marker, used for identifying layer
             } 

             // make sure the anchor matches the center point of the source cube map since faces are offset from this
             // this is for the upgrade case where the source cubemap changes size 4:3 to 3:2 on refresh
             faceLayer.transform.position.setValue(compCenter);
            
             /* Hide unneeded regions by applying a mask*/
        
             var maskShape = new Shape();

             if (use32CubeMap) {
                 if (face_i == 1) maskShape.vertices = [[0 * cube_face_size, 0 * cube_face_size], [0 * cube_face_size, 1 * cube_face_size], [1 * cube_face_size, 1 * cube_face_size], [1 * cube_face_size, 0 * cube_face_size]]; // front
                 else if (face_i == 2) maskShape.vertices = [[1 * cube_face_size, 0 * cube_face_size], [1 * cube_face_size, 1 * cube_face_size], [2 * cube_face_size, 1 * cube_face_size], [2 * cube_face_size, 0 * cube_face_size]]; // right
                 else if (face_i == 3) maskShape.vertices = [[2 * cube_face_size, 0 * cube_face_size], [2 * cube_face_size, 1 * cube_face_size], [3 * cube_face_size, 1 * cube_face_size], [3 * cube_face_size, 0 * cube_face_size]]; // back
                 else if (face_i == 4) maskShape.vertices = [[0 * cube_face_size, 1 * cube_face_size], [0 * cube_face_size, 2 * cube_face_size], [1 * cube_face_size, 2 * cube_face_size], [1 * cube_face_size, 1 * cube_face_size]]; // left
                 else if (face_i == 5) maskShape.vertices = [[1 * cube_face_size, 1 * cube_face_size], [1 * cube_face_size, 2 * cube_face_size], [2 * cube_face_size, 2 * cube_face_size], [2 * cube_face_size, 1 * cube_face_size]]; // top
                 else if (face_i == 6) maskShape.vertices = [[2 * cube_face_size, 1 * cube_face_size], [2 * cube_face_size, 2 * cube_face_size], [3 * cube_face_size, 2 * cube_face_size], [3 * cube_face_size, 1 * cube_face_size]]; // bottom   
             } else {
                 // original 4:3 cubemap
                 if (face_i == 1) maskShape.vertices = [[1 * cube_face_size, 1 * cube_face_size], [1 * cube_face_size, 2 * cube_face_size], [2 * cube_face_size, 2 * cube_face_size], [2 * cube_face_size, 1 * cube_face_size]]; // front
                 else if (face_i == 2) maskShape.vertices = [[2 * cube_face_size, 1 * cube_face_size], [2 * cube_face_size, 2 * cube_face_size], [3 * cube_face_size, 2 * cube_face_size], [3 * cube_face_size, 1 * cube_face_size]]; // right
                 else if (face_i == 3) maskShape.vertices = [[3 * cube_face_size, 1 * cube_face_size], [3 * cube_face_size, 2 * cube_face_size], [4 * cube_face_size, 2 * cube_face_size], [4 * cube_face_size, 1 * cube_face_size]]; // back
                 else if (face_i == 4) maskShape.vertices = [[0 * cube_face_size, 1 * cube_face_size], [0 * cube_face_size, 2 * cube_face_size], [1 * cube_face_size, 2 * cube_face_size], [1 * cube_face_size, 1 * cube_face_size]]; // left
                 else if (face_i == 5) maskShape.vertices = [[1 * cube_face_size, 0 * cube_face_size], [1 * cube_face_size, 1 * cube_face_size], [2 * cube_face_size, 1 * cube_face_size], [2 * cube_face_size, 0 * cube_face_size]]; // top
                 else if (face_i == 6) maskShape.vertices = [[1 * cube_face_size, 2 * cube_face_size], [1 * cube_face_size, 3 * cube_face_size], [2 * cube_face_size, 3 * cube_face_size], [2 * cube_face_size, 2 * cube_face_size]]; // bottom        
            }
            maskShape.closed = true;
            
            var maskPropertyName = localize("$$$/AE/Script/VR/CubeFaceMask=Face Mask");
            var maskProperty = faceLayer.mask.property(maskPropertyName);
            if(maskProperty==null)
            {
                maskProperty = faceLayer.mask.addProperty("ADBE Mask Atom");
                maskProperty.name = maskPropertyName;
            }
        
            maskProperty.property("ADBE Mask Shape").setValue(maskShape);

            // 3:2 cubemap expansion of 1 gets into trouble because shared edges in that layout may not be actually connected, unlike 4:3
            maskProperty.property("ADBE Mask Offset").setValue(use32CubeMap ? 0 : 1);
       
            /* Rotate and position layer properly */
            
             //faceLayer.property(camera_rotation_axis[face_i-1]).setValue(camera_rotation_angles[face_i-1]);
            setTransformRotationByFaceIndex(faceLayer.transform, face_i);

            if (use32CubeMap)
            {
                var posOffsetsPerFace = [
                    [2, 1, 1],  // front
                    [1, 1, 0],  // right
                    [2, 1, -1],  // back
                    [-1, -1, 2],  // left
                    [0, -1, -1],  // top
                    [-2, 1, 1],  // bottom
                ];
                var posOffsetThisFace = posOffsetsPerFace[face_i - 1];
                var posValue = [
                    compCenter[0] + (posOffsetThisFace[0] / 2 * cube_face_size),
                    compCenter[1] + (posOffsetThisFace[1] / 2 * cube_face_size),
                    compCenter[2] + (posOffsetThisFace[2] / 2 * cube_face_size)
                ];
                faceLayer.transform.position.setValue(posValue);
            }
            else
            {
                // original 4:3 behavior
                if (face_i == 1) faceLayer.transform.position.setValue([compCenter[0] + 1 / 2 * cube_face_size, compCenter[1] + 0, compCenter[2] + 1 / 2 * cube_face_size]); // front
                else if (face_i == 2) faceLayer.transform.position.setValue([compCenter[0] + 1 / 2 * cube_face_size, compCenter[1] + 0, compCenter[2] + 1 / 2 * cube_face_size]); // right
                else if (face_i == 3) faceLayer.transform.position.setValue([compCenter[0] + 3 / 2 * cube_face_size, compCenter[1] + 0, compCenter[2] - 1 / 2 * cube_face_size]); // back
                else if (face_i == 4) faceLayer.transform.position.setValue([compCenter[0] + -1 / 2 * cube_face_size, compCenter[1] + 0, compCenter[2] + 3 / 2 * cube_face_size]); // left
                else if (face_i == 5) faceLayer.transform.position.setValue([compCenter[0] + 1 / 2 * cube_face_size, compCenter[1] - 1 / 2 * cube_face_size, compCenter[2] + cube_face_size]); // top
                else if (face_i == 6) faceLayer.transform.position.setValue([compCenter[0] + 1 / 2 * cube_face_size, compCenter[1] + 1 / 2 * cube_face_size, compCenter[2] + cube_face_size]); // bottom

            }

        }
     
        /* Generate SkyBox Output */
        
        generateSkyBoxFromComp(editComp, selectedComp.name, selectedComp.width, true, false, false, skyboxPanel.checkbox3dPlugins.value==false, skyboxPanel.checkboxBlending.value==true, true, true);
        
        /* Create separate comp for SkyBox Viewer and apply it */
        
        var outputComp =  findOutputCompForMasterCompName(selectedComp.name, skyboxFolder.items);
        if(outputComp!=null)
        {
            var viewerCompName = viewerCompNameFromNameLocalized(selectedComp.name);
            var viewerComp = findViewerCompWithinItemCollection(selectedComp.name, skyboxFolder.items);
            if(viewerComp==null) 
            {
                viewerComp = app.project.items.addComp(viewerCompName, outputComp.width, outputComp.height, outputComp.pixelAspect, outputComp.duration, outputComp.frameRate); // viewer comp
                viewerComp.parentFolder = skyboxFolder;
                viewerComp.comment = kSkyBoxV1ViewerCompCommentMarker;
            }
        
            /* Precomp _combined layer */
         
            var layer = findViewerLayerNameWithinItemCollection(viewerComp.layers);
            if(layer==null)
            {
                layer = viewerComp.layers.add(outputComp);
                layer.name = kViewerLayerNameLocalize;
                layer.comment = kViewerLayerNameCommentMarker;
            }
        
            var viewerEffect = layer.effect.property(kViewerPluginMatchName);
            if(viewerEffect==null)
            {
                viewerEffect = layer.effect.addProperty(kViewerPluginMatchName);
            }   
            
            var viewerFOVControlName = "Camera FOV (Horizontal)";
            var viewerFOV = layer.effect.property(viewerFOVControlName);
            if(viewerFOV==null)
            {
                viewerFOV = layer.effect.addProperty("ADBE Slider Control");
                viewerFOV.name = viewerFOVControlName;
                layer.effect.property(viewerFOVControlName).property(1).setValue(100); // 100 degress is the default FOV on YoutTube 360
            }
        
            /* Add Camera */
            
            var defaultViewerFrameWidth = 1024;
            var compCenter = [defaultViewerFrameWidth/2, defaultViewerFrameWidth/2, 0];

            var cam = findViewerCameraWithinItemCollection(viewerComp.layers);
            if(cam==null)
            {
                cam = viewerComp.layers.addCamera(viewerCameraNameLocalize, [0, 0]);
                cam.comment = viewerCameraNameCommentMarker;
                cam.zoom.expression = "vlyr=null;try{vlyr=thisComp.layerByComment('" + kViewerLayerNameCommentMarker + "');}catch(e){vlyr=thisComp.layerByComment('" + kViewerLayerNameOriginalEnglish + "');};thisComp.width / 2 / Math.tan(degreesToRadians(vlyr.effect('" + viewerFOVControlName + "').param(1).value/2))";
                cam.transform.position.setValue(compCenter);
                cam.transform.pointOfInterest.setValue(compCenter);  
                cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT; // makes it one-node camera by default (more simple to the user)
            }
        }
    
        /* Open Edit composition  if it's first extraction ever (not a refresh call), otherwise output comp will be opened by generateSkyBox() function */
        
        var isRefreshCall = (skyboxPanel.btnExtract.text == kRefreshSkyBoxButtonLabel);
        if(!isRefreshCall) editComp.openInViewer();
    }

    function createSkyBoxEditFromComp(selectedComp, editCompWidth, editCompRatio, recenterCamera, useTwoNodeCamera, useNullParent, threeDMode, useCollapseTransformMethod, useEdgeBlending, srcHasAlpha)
    {
         var precompViewerToSeeBackground = (selectedComp instanceof CompItem) && !srcHasAlpha;
         useCollapseTransformMethod = useCollapseTransformMethod && !srcHasAlpha; // force "Use 3D plugins mode" if srcHasAlpha is true (needed by Viewer)
        
         /* Determine new SkyBox name (based on comp name). Only one SkyBox per composition is allowed (duplicates not needed), so previous setup will be refreshed if exists */
         
         var folderName = outputCompNameFromNameLocalizeVersionAware(selectedComp.name);
         var skyboxFolder = findOutputFolderByNameLocalizeAware(selectedComp.name);
         if(skyboxFolder==null) skyboxFolder = app.project.items.addFolder(folderName);
         
         var supportFolder = findSupportFolderWithinItemCollection( skyboxFolder.items);
         if (supportFolder == null) {
             supportFolder = skyboxFolder.items.addFolder(kSupportFolderNameLocalize);
             supportFolder.comment = kSupportFolderNameCommentMarker;
         }
          
         /* 1. Precomp selected footage into separate comp, apply Viewer, add camera */
            
         var nextEditCompIndex = nextUniqueEditCompIndexFromName(selectedComp.name);
         
         var precompComp = null;
         var precompCam = null;
        //   var precompCompName = compNameWithPostfix(selectedComp.name, kSkyBoxPrecompNamePostfix + nextEditCompIndex);  
         var precompCompName = selectedComp.name + " (" + kSkyBoxPrecompEditLocalize + nextEditCompIndex + ")";
         if(precompViewerToSeeBackground)
         {
             precompComp = app.project.items.addComp(precompCompName, selectedComp.width, selectedComp.height, selectedComp.pixelAspect, selectedComp.duration, selectedComp.frameRate);    //precomp   (edit comp index)
             precompComp.parentFolder = supportFolder;
             precompComp.comment = kSkyBoxPrecompEditCommentMarker;
            
             var precompViewLayerName = selectedComp.name;    
             var layer = itemByNameWithinItemCollection(precompViewLayerName, "AVLayer", precompComp.layers);   //WARNING name dependency? expect layer to have same name as comp..preexist/ok?
             if(layer==null)
             {
                layer = precompComp.layers.add(selectedComp);
                layer.name = precompViewLayerName;
             }
            
            var viewerEffect = layer.effect.property(kViewerPluginMatchName);
            if(viewerEffect==null)
            {
                viewerEffect = layer.effect.addProperty(kViewerPluginMatchName);
                
                viewerEffect.property(kEffectViewerPropertyInputID).setValue(3);
                viewerEffect.property(kEffectViewerPropertyOutputWidthID).setValue(editCompWidth);
                viewerEffect.property(kEffectViewerPropertyOutputRatioID).setValue(editCompRatio + 1); // dropdown indices start at 1
            }
            
            precompCam = findMasterCameraWithinItemCollection( precompComp.layers);
            if(precompCam==null)
            {
                precompCam = precompComp.layers.addCamera(kMasterCameraNameLocalize, [0, 0]);
                precompCam.comment = kMasterCameraCommentMarker;        // marks this layer as the master camera
            }
        
            layer.locked = true;
            precompCam.locked = true;
        }
        
        /*
            2. Precomp into Edit comp to be able to apply masks and use camera tracker
           */
         
         var editCompHeight = 0;
         if(precompViewerToSeeBackground)
         {
             editCompHeight = precompComp.height; // precomp height was set by Viewer plugin
         }
         else
         {
             if(editCompRatio== METTLE_COMPOSITION_ASPECT_RATIO.R_1_1) editCompHeight = editCompWidth;
             else if(editCompRatio== METTLE_COMPOSITION_ASPECT_RATIO.R_4_3) editCompHeight = editCompWidth * 3 / 4;
             else if(editCompRatio== METTLE_COMPOSITION_ASPECT_RATIO.R_16_9) editCompHeight = editCompWidth * 9 / 16;
             else if(editCompRatio== METTLE_COMPOSITION_ASPECT_RATIO.R_16_10) editCompHeight = editCompWidth * 10 / 16;
         }

        // space separator needed in case translated string ends with a number
         var editCompName = compNameWithPostfix(selectedComp.name, kSkyBoxV2EditCompNamePostfixLocalize + " " + nextEditCompIndex);
         var editComp = findEditCompWithinItemCollection(selectedComp.name, kSkyboxVersionV2, nextEditCompIndex, skyboxFolder.items);
         if(editComp==null)
         {
            editComp = app.project.items.addComp(editCompName, editCompWidth, editCompHeight, selectedComp.pixelAspect, selectedComp.duration, selectedComp.frameRate);   // edit comp index
            editComp.parentFolder = skyboxFolder; 
            editComp.comment = compTagFromProperties(false, true, defaultUserGivenName(nextEditCompIndex, threeDMode), threeDMode, !useCollapseTransformMethod, useEdgeBlending, useTwoNodeCamera, useNullParent, recenterCamera, false, srcHasAlpha);
         }
        
         if(precompViewerToSeeBackground)
         {
             var precompLayerName = precompCompName;    
             var layer = itemByNameWithinItemCollection(precompLayerName, "AVLayer", editComp.layers);  //FIXME?
             if(layer==null)
             {
                layer = editComp.layers.add(precompComp);
                layer.name = precompLayerName; 
                layer.comment = layerTagFromProperties(true, false);    //sets as precomp viewer layer
             }
        }
     
         var editCam = findMasterCameraWithinItemCollection( editComp.layers);
        if(editCam==null)
        {
            var camTuple = createMasterCamInComp(editComp, recenterCamera, useTwoNodeCamera, useNullParent);
            editCam = camTuple[0];
            
            if(precompViewerToSeeBackground)
            {
                /* Link camera properties between precomp and edit comp */

                // The master camera layer (mc) is found via a none-localized marker in the comment field
                // if this is not present, fall back to the old english specific camera name (old skybox projects)
                var lyrex = "cmp = comp('"+editCompName+"');";
                lyrex = lyrex + "mc=null;try{mc = cmp.layerByComment('" + kMasterCameraCommentMarker + "');}catch(e){mc = cmp.layer('" + kMasterCameraNameOriginalEnglish + "');};";

                precompCam.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
                precompCam.transform.position.expression = ("[0,0,0]");
                precompCam.transform.orientation.expression = ("try{"+lyrex+";b = Math.asin(clamp(mc.toWorldVec([0,0,1])[0],-1,1)/thisComp.pixelAspect); if (Math.abs(Math.cos(b)) > .0005) {c = -Math.atan2(mc.toWorldVec([0,1,0])[0],mc.toWorldVec([1,0,0])[0]);a = -Math.atan2(mc.toWorldVec([0,0,1])[1],mc.toWorldVec([0,0,1])[2]);} else {a = Math.atan2(mc.toWorldVec([1,0,0])[1],mc.toWorldVec([0,1,0])[1]);c = 0;}[radiansToDegrees(a),radiansToDegrees(b),radiansToDegrees(c)];}catch(e){value;}");  
                precompCam.transform.xRotation.expression = ("0");
                precompCam.transform.yRotation.expression = ("0");
                precompCam.transform.zRotation.expression = ("0"); 
                precompCam.cameraOption.zoom.expression =  ""+lyrex+"mc.cameraOption.zoom";            
                precompCam.cameraOption.depthOfField.expression =  ""+lyrex+"mc.cameraOption.depthOfField";
                precompCam.cameraOption.focusDistance.expression =  ""+lyrex+"mc.cameraOption.focusDistance";
                precompCam.cameraOption.aperture.expression =  ""+lyrex+"mc.cameraOption.aperture";
                precompCam.cameraOption.blurLevel.expression =  ""+lyrex+"mc.cameraOption.blurLevel";
                precompCam.cameraOption("ADBE Iris Shape").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Shape')";
                precompCam.cameraOption("ADBE Iris Rotation").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Rotation')";
                precompCam.cameraOption("ADBE Iris Roundness").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Roundness')";
                precompCam.cameraOption("ADBE Iris Aspect Ratio").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Aspect Ratio')";
                precompCam.cameraOption("ADBE Iris Diffraction Fringe").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Diffraction Fringe')";
                precompCam.cameraOption("ADBE Iris Highlight Gain").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Highlight Gain')";
                precompCam.cameraOption("ADBE Iris Highlight Threshold").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Highlight Threshold')";
                precompCam.cameraOption("ADBE Iris Hightlight Saturation").expression =  ""+lyrex+"mc.cameraOption('ADBE Iris Hightlight Saturation')";
            }
        }
     
         /* 
             * 3. Create combined & output comps (if not exist)
             */
         
         var includeOriginalCompInOutput = (selectedComp instanceof CompItem); // we should always include original comp (if it's not dummy) to have audio
         var enableOriginalCompInOutput = !srcHasAlpha; // we should hide original comp when source has alpha to improve output quality (avoid duplication)
         
         var outputTuple = createSkyBoxOutputFromComp(selectedComp, includeOriginalCompInOutput, enableOriginalCompInOutput, METTLE_OUTPUT_FORMAT.EQUIMAP_2_1);
         var combinedComp = outputTuple[0];
         var outputComp = outputTuple[1];
         
        /*
            * 4. Process current edit inot combined/output comps: precomp edit comp (in 2d mode) or generate skybox (in 3d mode) to combined comp
            */
        
        var editLayerInCombinedComp = null;
        if(threeDMode)
        {
            if(srcHasAlpha) // should include source footage as viewer instance into Edit comp
            {
                var precompViewLayerName = selectedComp.name;       //FIXME?
                var layer = itemByNameWithinItemCollection(precompViewLayerName, "AVLayer", editComp.layers);   //WARNING depends on layer name?
                if(layer==null)
                {
                    layer = editComp.layers.add(selectedComp);
                    layer.name = precompViewLayerName;
                }

                var viewerEffect = layer.effect.property(kViewerPluginMatchName);
                if(viewerEffect==null)
                {
                    viewerEffect = layer.effect.addProperty(kViewerPluginMatchName);

                    viewerEffect.property(kEffectViewerPropertyInputID).setValue(3);
                    viewerEffect.property(kEffectViewerPropertyOutputWidthID).setValue(editCompWidth);
                    viewerEffect.property(kEffectViewerPropertyOutputRatioID).setValue(editCompRatio + 1); // dropdown indices start at 1
                }
            }
        
            /* Generate skybox */
        
            var generatorOutputCompName = generatorOutputCompNameForEditCompName(editComp.name);    // add " (3D)"
            generateSkyBoxFromComp(editComp, generatorOutputCompName, selectedComp.width, recenterCamera, useTwoNodeCamera, useNullParent, useCollapseTransformMethod, useEdgeBlending, false, false);
            
            /* Organize folders */
            
            var generatorFolder = findOutputFolderByNameLocalizeAware(generatorOutputCompName);
            if(generatorFolder!=null)
            {
                 generatorFolder.parentFolder = supportFolder;
                
    //FIXME is this correct? changed expect match
                 var generatorOutputComp = itemByNameWithinItemCollection(generatorFolder.name, "CompItem", generatorFolder.items);
                if(generatorOutputComp!=null)
                {
                    editLayerInCombinedComp = combinedComp.layers.add(generatorOutputComp);
                    editLayerInCombinedComp.name = editCompName;
                }
            }
        }
        else // 2d mode
        {
            editLayerInCombinedComp = combinedComp.layers.add(editComp);
        
            var project2DEffect = editLayerInCombinedComp.effect.property(kProject2DPluginMatchName);
            if(project2DEffect==null)
            {
                project2DEffect = editLayerInCombinedComp.effect.addProperty(kProject2DPluginMatchName);
                
      		// the number of properties varies with the VR effect version
      		// in AE16.0, the VR180 params got added at the front shifting all the indexes down
                var projPropCount = project2DEffect.numProperties;
                var EffectVersionisAE16OrLayer = ( projPropCount >= 18 );
                var offsetEffectIndex = 0;   // use original index
                 if (EffectVersionisAE16OrLayer) offsetEffectIndex = 3;
                 
                //WARNING compname?
                project2DEffect.property(kEffectProject2DPropertyScaleID + offsetEffectIndex).expression = ("var half_horizontal_tan = comp('" + editComp.name + "').width / (2*comp('" + editComp.name + "').activeCamera.zoom);var vertical = 2*Math.atan(half_horizontal_tan*comp('" + editComp.name + "').height/comp('" + editComp.name + "').width);radiansToDegrees(vertical);");
                project2DEffect.property(kEffectProject2DPropertyProjTiltXID+ offsetEffectIndex).expression = ("try{mc=comp('" + editComp.name + "').activeCamera;b = Math.asin(clamp(mc.toWorldVec([0,0,1])[0],-1,1)/thisComp.pixelAspect); if (Math.abs(Math.cos(b)) > .0005) { c = -Math.atan2(mc.toWorldVec([0,1,0])[0],mc.toWorldVec([1,0,0])[0]);a = -Math.atan2(mc.toWorldVec([0,0,1])[1],mc.toWorldVec([0,0,1])[2]);} else {a = Math.atan2(mc.toWorldVec([1,0,0])[1],mc.toWorldVec([0,1,0])[1]);c = 0;}var xyz = [radiansToDegrees(a),radiansToDegrees(b),radiansToDegrees(c)];-xyz[0];}catch(e){value;}");
                project2DEffect.property(kEffectProject2DPropertyProjPanYID+ offsetEffectIndex).expression = ("try{mc=comp('" + editComp.name + "').activeCamera;b = Math.asin(clamp(mc.toWorldVec([0,0,1])[0],-1,1)/thisComp.pixelAspect); if (Math.abs(Math.cos(b)) > .0005) { c = -Math.atan2(mc.toWorldVec([0,1,0])[0],mc.toWorldVec([1,0,0])[0]);a = -Math.atan2(mc.toWorldVec([0,0,1])[1],mc.toWorldVec([0,0,1])[2]);} else {a = Math.atan2(mc.toWorldVec([1,0,0])[1],mc.toWorldVec([0,1,0])[1]);c = 0;}var xyz = [radiansToDegrees(a),radiansToDegrees(b),radiansToDegrees(c)]; xyz[1];}catch(e){value;}");
                project2DEffect.property(kEffectProject2DPropertyProjRollID+ offsetEffectIndex).expression = ("try{mc=comp('" + editComp.name + "').activeCamera;b = Math.asin(clamp(mc.toWorldVec([0,0,1])[0],-1,1)/thisComp.pixelAspect); if (Math.abs(Math.cos(b)) > .0005) { c = -Math.atan2(mc.toWorldVec([0,1,0])[0],mc.toWorldVec([1,0,0])[0]);a = -Math.atan2(mc.toWorldVec([0,0,1])[1],mc.toWorldVec([0,0,1])[2]);} else {a = Math.atan2(mc.toWorldVec([1,0,0])[1],mc.toWorldVec([0,1,0])[1]);c = 0;}var xyz = [radiansToDegrees(a),radiansToDegrees(b),radiansToDegrees(c)];-xyz[2];}catch(e){value;}");
            }
        }
    
        /* Lock layer and disable audio, audio will be enabled only on a backgraound (original) layer */
    
        if(editLayerInCombinedComp!=null)
        {
            if(editLayerInCombinedComp.hasAudio)
                editLayerInCombinedComp.audioEnabled = false;
            
            editLayerInCombinedComp.locked = true;
        }
        
        /* Open Edit composition */
        
        outputComp.openInViewer();
        editComp.openInViewer();
    }

    function createSkyBoxOutputFromComp(selectedComp, includeOriginalAsPrecomp, enableOriginalAsPrecomp, outputFormat)
    {
        var folderName = outputCompNameFromNameLocalizeVersionAware(selectedComp.name);
        var skyboxFolder = findOutputFolderByNameLocalizeAware(selectedComp.name);
         if(skyboxFolder==null) skyboxFolder = app.project.items.addFolder(folderName);
         
         var supportFolder = findSupportFolderWithinItemCollection(skyboxFolder.items);
         if (supportFolder == null) {
             supportFolder = skyboxFolder.items.addFolder(kSupportFolderNameLocalize);
             supportFolder.comment = kSupportFolderNameCommentMarker;
         }
         
         var combinedComp = findPrecompCombinedWithinItemCollection(selectedComp.name, supportFolder.items);
         if(combinedComp==null)
         {
             var combinedCompName = selectedComp.name + " (" + kSkyBoxPrecompCombinedPostfixLocalize + ")";
            combinedComp = app.project.items.addComp(combinedCompName, selectedComp.width, selectedComp.height, selectedComp.pixelAspect, selectedComp.duration, selectedComp.frameRate);       // combined comp
            combinedComp.parentFolder = supportFolder;
            combinedComp.comment = kSkyBoxPrecompCombinedCommentMarker;
         }
         
         if(includeOriginalAsPrecomp)
         {
            var originalLayerName = selectedComp.name;    
            var originalLayer = itemByNameWithinItemCollection(originalLayerName, "AVLayer", combinedComp.layers);
            if(originalLayer==null)
            {
               originalLayer = combinedComp.layers.add(selectedComp);
            }
           
            originalLayer.locked = false;
            originalLayer.enabled = enableOriginalAsPrecomp;
            originalLayer.locked = true;
         }

        outputCompName = outputCompNameFromNameLocalizeVersionAware(selectedComp.name);
        var outputComp = findOutputCompForMasterCompName(selectedComp.name, skyboxFolder.items);
        if(outputComp==null)
        {
            outputComp = app.project.items.addComp(outputCompName, selectedComp.width, selectedComp.height, selectedComp.pixelAspect, selectedComp.duration, selectedComp.frameRate);       // output comp.  create skybox output from comp
            outputComp.parentFolder = skyboxFolder;
            outputComp.comment = compTagFromProperties(true, false, selectedComp.name, false, false, false, false, false, false, false, false);
            
            var outputLayer = outputComp.layers.add(combinedComp);
            outputLayer.name = kConverterLayerNameLocalize;
            outputLayer.comment = kConverterLayerNameCommentMarker;  // sets as converter layer in output comp.  This used to be a older tag structure with flags
            
            outputLayer.effect.addProperty(kConverterPluginMatchName);
            outputLayer.effect.property(kConverterPluginMatchName).property(kEffectConverterPropertyInputID).setValue(4);
            outputLayer.effect.property(kConverterPluginMatchName).property(kEffectConverterPropertyOutputID).setValue(1 + outputFormat);
            outputLayer.effect.property(kConverterPluginMatchName).property(kEffectConverterPropertyOutputWidthID).setValue(selectedComp.width);
        }
    
        return [combinedComp, outputComp];
    }

    /* MAIN */
    var canWriteFilesAndAccessNetwork = (app.preferences.getPrefAsLong(kMainPrefSection, kPrefScriptingFileNetworkSecurity) == 1);
     
    if (!canWriteFilesAndAccessNetwork)
    {
        alert(localize("$$$/AE/Script/VR/RequireWriteAlert=This script requires to write files. Please enable the \"Allow Scripts to Write Files and Access Network\" setting in Preferences > Scripting & Expressions."));

        app.executeCommand(3131); // opens "Scripting & Expressions" panel in Preferences

        canWriteFilesAndAccessNetwork = (app.preferences.getPrefAsLong(kMainPrefSection, kPrefScriptingFileNetworkSecurity) == 1);
    }

    if(canWriteFilesAndAccessNetwork)
    {
        if(script_type==METTLE_SCRIPT_TYPE.CREATOR) skyboxPanel = (rootObject instanceof Panel) ? rootObject : new Window("palette", localize("$$$/AE/Script/VR/CreatorDlg=Create VR Environment"),[0,0,310,402]);  //REVIEW name
        else if(script_type==METTLE_SCRIPT_TYPE.EXTRACTOR) skyboxPanel = (rootObject instanceof Panel) ? rootObject : new Window("palette", localize("$$$/AE/Script/VR/ExtractorDlg=VR Extract Cubemap"),[0,0,310,214]); // Review name
        else if (script_type == METTLE_SCRIPT_TYPE.COMPOSER) {
            // pane with scrollbar
            var bounds = [0, 0, 214, 340];
            skyboxPanel = (rootObject instanceof Panel) ? rootObject : new Window("palette", localize("$$$/AE/Script/VR/CompEditorPane=VR Comp Editor"), bounds);

            // Scrollbar
            //var spacing = 10;
            //var height = 20;
            //bounds[1] = bounds[3] + spacing;
            //bounds[3] = bounds[1] + height;
            //skyboxPanel.add("scrollbar", bounds, "Scroll");
        }

        createUIControls();
        
        if(script_type==METTLE_SCRIPT_TYPE.COMPOSER)
        {
            app.preferences.savePrefAsBool(kAppWarningPrefSection, kPrefCamerasAndLightsAffectStuff, false);
            
            refreshSkyBoxComposerUI();
            
            skyboxPanel.addEventListener( "mousemove", function(e)
            {
                /*Refresh composition tree and UI periodically */
                
                var curTime = (new Date()).getTime();
                if( curTime-timeOfLastDynamicControlsUpdate >= 1500) 
                {
                    refreshSkyBoxComposerUI();
                    timeOfLastDynamicControlsUpdate = curTime;
                }
            });
        }
        else
        {
            skyboxPanel.onActivate = function()
            {
                var curTime = (new Date()).getTime();
                if( curTime-timeOfLastDynamicControlsUpdate >= 2*1000) // allow 2 seconds interval
                {
                    timeOfLastDynamicControlsUpdate = curTime;
                    updateDynamicControls();
                }
            }

            skyboxPanel.center();
            skyboxPanel.show();
        }
    }

}

// IMPORTANT: The name of the function gets changed at runtime before execution
// for the Creator/Extractor cases.  Composer is the "original" master version
//mettleSkyBoxCreator(METTLE_SCRIPT_TYPE.CREATOR, this);
//mettleSkyBoxExtractor(METTLE_SCRIPT_TYPE.EXTRACTOR, this);
mettleSkyBoxComposer(METTLE_SCRIPT_TYPE.COMPOSER, this);
