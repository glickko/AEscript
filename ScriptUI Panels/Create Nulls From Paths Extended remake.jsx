/*
    Create Nulls From Paths.jsx v.0.5
    Attach nulls to shape and mask vertices, and vice-versa.

    Changes:
        - wraps it all in an IIFE
        - fixes call to missing method array.indexOf
*/
/*
    Extended version by crunchycph.dk  -  youtube.com/c/crunchycphdk

    Added features:
        - Add controls for bezier handles
        - Use locators instead of nulls
        - Create path from nulls
            - Uniform bezierepath
            - Auto soft / round corners
            - Close path
        - Save settings
        - Responsive interface

    Possibly upcoming features:
        - Parent nulls to shape layer
        - Remove controls from path
        - Option to create locator master style
*/

/*
    Modified by Thor Sarup
    - Ability to rotate / scale points (handles follow)
    - locked rotation and scaling of handles (only for indicators)
    - sets handles to shy
    - renamed script to "Path tools" to save precious panel space :)
*/

/*
    Update by crunchy 30. oct. 2017
        - Fixed bug when both handle controls and use locators was selected for Create Path From Selected
        - Renamed the plugin back to it's original, since it explains pretty well what this is doing. :)
        - Researched the posibility to only connect selected verticies. But that is not posible since there is nothing like a selectedVerticies property

*/
(function createNullsFromPaths (thisObj) {
    /* Build UI */
    function buildUI(thisObj) {

        var windowTitle = localize("$$$/AE/Script/CreatePathNulls/CreateNullsFromPaths=Create Nulls From Paths Extended");
        var buttonPointsFollowNulls = localize("$$$/AE/Script/CreatePathNulls/PathPointsToNulls=Points Follow Nulls");
        var buttonNullsFollowPoints = localize("$$$/AE/Script/CreatePathNulls/NullsToPathPoints=Nulls Follow Points");
        var buttonTracePath = localize("$$$/AE/Script/CreatePathNulls/TracePath=Trace Path");
        var buttonCreatePathFromSelected = localize("$$$/AE/Script/CreatePathNulls/TracePath=Create Path From Selected");
        var checkHandles = localize("$$$/AE/Script/CreatePathNulls/AddControlsForHandles=Handle Controls");
        var checkUseLocators = localize("$$$/AE/Script/CreatePathNulls/AddControlsForHandles=Use Locators");
        
        var win = (thisObj instanceof Panel)? thisObj : new Window('palette', windowTitle);
            win.spacing = 0;
            win.margins = 4;
            win.myButtonGroup = win.add ("group");
                win.myButtonGroup.spacing = 4;
                win.myButtonGroup.margins = 0;
                win.myButtonGroup.orientation = "row";
                win.buttonPointsFollowNulls = win.myButtonGroup.add ("button", undefined, buttonPointsFollowNulls);
                win.buttonNullsFollowPoints = win.myButtonGroup.add ("button", undefined, buttonNullsFollowPoints);
                win.buttonTracePath = win.myButtonGroup.add ("button", undefined, buttonTracePath);
                win.buttonCreatePathFromSelected = win.myButtonGroup.add ("button", undefined, buttonCreatePathFromSelected);
                win.checkHandles = win.myButtonGroup.add ("checkbox", undefined, checkHandles);
                win.checkHandles.value = savedSettingHandles;
                win.checkUseLocators = win.myButtonGroup.add ("checkbox", undefined, checkUseLocators);
                win.checkUseLocators.value = savedSettingUseLocators;
                win.myButtonGroup.alignment = "center";
                win.myButtonGroup.alignChildren = "center";

            win.checkHandles.onClick = function()
            {
                app.settings.saveSetting("createnullsfrompathsextendedsettings", "handles", String(win.checkHandles.value));
                savedSettingHandles = win.checkHandles.value;
            }
            
            win.checkUseLocators.onClick = function()
            {
                app.settings.saveSetting("createnullsfrompathsextendedsettings", "useLocators", String(win.checkUseLocators.value));
                savedSettingUseLocators = win.checkUseLocators.value;
            }

            win.buttonPointsFollowNulls.onClick = function(){
                linkPointsToNulls();
            }
            win.buttonNullsFollowPoints.onClick = function(){
                linkNullsToPoints();
            }
            win.buttonTracePath.onClick = function(){
                tracePath();
            }
            win.buttonCreatePathFromSelected.onClick = function(){
                showCreatePathFromSelectedWindow();
            }

            win.onResize = function()
            {
                win.myButtonGroup.orientation = win.size[0]>600?"row":"column";
				win.myButtonGroup.alignChildren = win.size[0]>600?"center":"left";
                win.layout.layout(true);
            }

        win.layout.layout(true);

        return win
    }

    // Save settings
    var savedSettingHandles = app.settings.haveSetting("createnullsfrompathsextendedsettings", "handles")?(app.settings.getSetting("createnullsfrompathsextendedsettings", "handles")=="true"?true:false):false;
    var savedSettingUseLocators = app.settings.haveSetting("createnullsfrompathsextendedsettings", "useLocators")?(app.settings.getSetting("createnullsfrompathsextendedsettings", "useLocators")=="true"?true:false):false;
    var savedSettingCornerType = app.settings.haveSetting("createnullsfrompathsextendedsettings", "cornerType")?Number(app.settings.getSetting("createnullsfrompathsextendedsettings", "cornerType")):0;
    var savedSettingSmoothness = app.settings.haveSetting("createnullsfrompathsextendedsettings", "smoothness")?Number(app.settings.getSetting("createnullsfrompathsextendedsettings", "smoothness")):100;
    var savedSettingClosePath = app.settings.haveSetting("createnullsfrompathsextendedsettings", "closePath")?(app.settings.getSetting("createnullsfrompathsextendedsettings", "closePath")=="true"?true:false):false;
    
    // Show the Panel
    var w = buildUI(thisObj);
    if (w.toString() == "[object Panel]") {
        w;
    } else {
        w.show();
    }

    // Create Path From Selected Window
    function showCreatePathFromSelectedWindow()
    {
        var cpfsWindow = new Window("palette");
        cpfsWindow.orientation = "column";
        cpfsWindow.alignChildren = "left";
        cpfsWindow.spacing = 5;

        var row1 = cpfsWindow.add("group");
        row1.orientation = "row";
        row1.alignChildren = "left";

        var row2 = cpfsWindow.add("group");
        row2.orientation = "row";
        row2.alignChildren = "left";

        var row3 = cpfsWindow.add("group");
        row3.orientation = "row";
        row3.alignChildren = "left";

        var row4 = cpfsWindow.add("group");
        row4.orientation = "row";
        row4.alignChildren = "left";

        var buttons = cpfsWindow.add("group");
        buttons.orientation = "row";
        buttons.alignChildren = "right";
        
        var label1 = row1.add("statictext",undefined, "Unique layer name", {"multiline":false});
        var label2 = row2.add("statictext",undefined, "Corner type", {"multiline":false});
        var label3 = row3.add("statictext",undefined, "Smoothness", {"multiline":false});
        var chClosePath = row4.add("checkbox",undefined, "Close path");
        chClosePath.value = savedSettingClosePath;
        
        var inpName = row1.add("editText", undefined, "");
        inpName.size = [200, 24];
        var cbCornerType = row2.add("dropDownList", undefined, ["Sharp", "Smooth", "Bezier"]);
        cbCornerType.size = [100, 24];
        cbCornerType.selection = savedSettingCornerType;
        var inpSmoothness = row3.add("editText", undefined, savedSettingSmoothness);
        inpSmoothness.size = [100, 24];
        
        label3.enabled = cbCornerType.selection.text!="Sharp";
        inpSmoothness.enabled = cbCornerType.selection.text!="Sharp";

        cbCornerType.onChange = function()
        {
            label3.enabled = cbCornerType.selection.text!="Sharp";
            inpSmoothness.enabled = cbCornerType.selection.text!="Sharp";

            app.settings.saveSetting("createnullsfrompathsextendedsettings", "cornerType", cbCornerType.selection.index);
            savedSettingCornerType = cbCornerType.selection.index;
        }

        inpSmoothness.onChange = function()
        {
            app.settings.saveSetting("createnullsfrompathsextendedsettings", "smoothness", Number(inpSmoothness.text));
            savedSettingSmoothness = inpSmoothness.text;
        }

        chClosePath.onClick = function()
        {
            app.settings.saveSetting("createnullsfrompathsextendedsettings", "closePath", String(chClosePath.value));
            savedSettingClosePath = chClosePath.value;
        }
        
        var bCancel = buttons.add("button", undefined, "Cancel");
        var bOk = buttons.add("button", undefined, "Ok");

        bCancel.onClick = function()
        {
            cpfsWindow.close();
        }
        bOk.onClick = function()
        {
            if(inpName.text=="")
            {
                alert("Please enter a unique layer name");
                return;
            }
            cpfsWindow.close();
            createPathFromNSelected(inpName.text, cbCornerType.selection.text, Number(inpSmoothness.text), chClosePath.value);
        }
        
        cpfsWindow.show();
    }


    /* General functions */

    function getActiveComp(){
        var theComp = app.project.activeItem;
        if (theComp == undefined){
            var errorMsg = localize("$$$/AE/Script/CreatePathNulls/ErrorNoComp=Error: Please select a composition.");
            alert(errorMsg);
            return null
        }

        return theComp
    }

    function getSelectedLayers(targetComp){
        var targetLayers = targetComp.selectedLayers;
        return targetLayers
    }

    function createNull(targetComp){
        return targetComp.layers.addNull();
    }

    function createPointLocator(targetComp){
        var pointLocator = targetComp.layers.addShape();
        pointLocator.guideLayer = true;
        pointLocator.property("Scale").expression =
                "scl = transform.scale; \r" +
                "[Math.round(scl[0]*10) == 0 ? 0.1 : scl[0], \r" +
                "Math.round(scl[1]*10) == 0 ? 0.1 : scl[1]];";
        var rectGroup = pointLocator.property("Contents").addProperty("ADBE Vector Group");
        rectGroup.name = "RectGroup";
        
        var rect = rectGroup.property("Contents").addProperty("ADBE Vector Shape - Rect");
        rect.property("Size").setValue([30,30]);
        rect.property("Size").expression =
                "scl = thisLayer.scale; \r" +
                "[value[0] * 100 / (scl[0] < 0 ? -scl[0] : scl[0]), \r" +
                "value[1] * 100 / (scl[1] < 0 ? -scl[1] : scl[1])];";
        
        var rectFill = rectGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
        rectFill.property("Color").setValue([232/256, 146/256, 13/256]);
        
        return pointLocator;
    }

    function createHandleLocator(targetComp){
        var handleLocator = targetComp.layers.addShape();
        handleLocator.guideLayer = true;
        //handleLocator.shy = true;
        handleLocator.property("Scale").expression = "[100,100]";
        handleLocator.property("Rotation").expression = "0";

        var ellipseGroup = handleLocator.property("Contents").addProperty("ADBE Vector Group");
        ellipseGroup.name = "EllipseGroup";
        
        var rect = ellipseGroup.property("Contents").addProperty("ADBE Vector Shape - Ellipse");
        rect.property("Size").setValue([20,20]);
        rect.property("Size").expression =
                    "scl = parent.scale; \r" +
                    "[value[0] * 100 / (scl[0] < 0 ? -scl[0] : scl[0]), \r" +
                    "value[1] * 100 / (scl[1] < 0 ? -scl[1] : scl[1])];";
        
        var rectFill = ellipseGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
        rectFill.property("Color").setValue([61/256, 162/256, 165/256]);

        var lineGroup = handleLocator.property("Contents").addProperty("ADBE Vector Group");
        lineGroup.name = "LineGroup";
        
        var path = lineGroup.property("Contents").addProperty("ADBE Vector Shape - Group");
        path.property("Path").expression = "createPath([[0,0], -transform.position], [[0,0],[0,0]], [[0,0],[0,0]], false);";
        
        var pathStroke = lineGroup.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
        pathStroke.property("Color").setValue([61/256, 162/256, 165/256]);
        pathStroke.property("Stroke Width").setValue(6);
        pathStroke.property("Stroke Width").expression =
                    "scl = parent.scale[0]; \r" +
                    "value * 100 / (scl < 0 ? -scl : scl);";

        return handleLocator;
    }

    function getSelectedProperties(targetLayer){
        var props = targetLayer.selectedProperties;
        if (props.length < 1){
            return null
        }
        return props
    }

    function forEachLayer(targetLayerArray, doSomething) {
        for (var i = 0, ii = targetLayerArray.length; i < ii; i++){
            doSomething(targetLayerArray[i]);
        }
    }

    function forEachProperty(targetProps, doSomething){
        for (var i = 0, ii = targetProps.length; i < ii; i++){
            doSomething(targetProps[i]);
        }
    }

    function forEachEffect(targetLayer, doSomething){
        for (var i = 1, ii = targetLayer.property("ADBE Effect Parade").numProperties; i <= ii; i++) {
            doSomething(targetLayer.property("ADBE Effect Parade").property(i));
        }
    }

    function matchMatchName(targetEffect,matchNameString){
        if (targetEffect != null && targetEffect.matchName === matchNameString) {
            return targetEffect
        } else {
            return null
        }
    }

    function getPropPath(currentProp,pathHierarchy){
        var pathPath = "";
            while (currentProp.parentProperty !== null){

                if ((currentProp.parentProperty.propertyType === PropertyType.INDEXED_GROUP)) {
                    pathHierarchy.unshift(currentProp.propertyIndex);
                    pathPath = "(" + currentProp.propertyIndex + ")" + pathPath;
                } else {
                    pathPath = "(\"" + currentProp.matchName.toString() + "\")" + pathPath;
                }

                // Traverse up the property tree
                currentProp = currentProp.parentProperty;
            }
        return pathPath
    }

    function getPathPoints(path){
        return path.value.vertices;
    }

    function getPathInTangents(path){
        return path.value.inTangents;
    }

    function getPathOutTangents(path){
        return path.value.outTangents;
    }

    function getCreateControlsForHandles()
    {
        return w.checkHandles.value;
    }

    function getUseLocators()
    {
        return w.checkUseLocators.value;
    }


    /* Project specific code */

    function forEachPath(doSomething){

        var comp = getActiveComp();

        if(comp == null) {
            return
        }

            var selectedLayers = getSelectedLayers(comp);
            if (selectedLayers == null){
                return
            }

            // First store the set of selected paths
            var selectedPaths = [];
            var parentLayers = [];
            forEachLayer(selectedLayers,function(selectedLayer){

                var paths = getSelectedProperties(selectedLayer);
                if (paths == null){
                    return
                }

                forEachProperty(paths,function(path){
                    var isShapePath = matchMatchName(path,"ADBE Vector Shape");
                    var isMaskPath = matchMatchName(path,"ADBE Mask Shape");
                // var isPaintPath = matchMatchName(path,"ADBE Paint Shape"); //Paint and roto strokes not yet supported in scripting
                    if(isShapePath != null || isMaskPath != null ){
                        selectedPaths.push(path);
                        parentLayers.push(selectedLayer);
                    }
                });
            });

            // Then operate on the selection
            if (selectedPaths.length == 0){
                var pathError = localize("$$$/AE/Script/CreatePathNulls/ErrorNoPathsSelected=Error: No paths selected.");

                alert(pathError);
                return
            }

            for (var p = 0; p < selectedPaths.length; p++) {
                    doSomething(comp,parentLayers[p],selectedPaths[p]);
            }

    }

    function linkNullsToPoints(){
        var undoGroup = localize("$$$/AE/Script/CreatePathNulls/LinkNullsToPathPoints=Link Nulls to Path Points");
        app.beginUndoGroup(undoGroup);

        forEachPath(function(comp,selectedLayer,path){
            var createControlsForHandles = getCreateControlsForHandles();
            var pathHierarchy = [];
            var pathPath = getPropPath(path, pathHierarchy);
            // Creation functions to use
            var createPointFunction = getUseLocators() ? createPointLocator : createNull;
            var createHandleFunction = getUseLocators() ? createHandleLocator : createNull;
            var handleScale = getUseLocators() ? 100 : 50;
            // Do things with the path points
            var pathPoints = getPathPoints(path);
            var pathInTangents = getPathInTangents(path);
            var pathOutTangents = getPathOutTangents(path);
            for (var i = 0, ii = pathPoints.length; i < ii; i++){
                var nullName = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "]";
                var nullNameIn = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "][In]";
                var nullNameOut = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "][Out]";
                if(comp.layer(nullName) == undefined){
                    var newNull = createPointFunction(comp);
                    newNull.position.setValue(pathPoints[i]);
                    newNull.position.expression =
                            "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                            "var srcPath = srcLayer" + pathPath + ".points()[" + i + "]; \r" +
                            "srcLayer.toComp(srcPath);";
                    newNull.name = nullName;
                    newNull.label = 10;

                    if(createControlsForHandles)
                    {
                        var newNullIn = createHandleFunction(comp);
                        newNullIn.parent = newNull;
                        newNullIn.position.setValue(pathInTangents[i]);
                        newNullIn.position.expression =
                                "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                                "var srcPath = srcLayer" + pathPath + ".inTangents()[" + i + "]; \r" +
                                "srcPath";
                        newNullIn.name = nullNameIn;
                        newNullIn.label = 14;
                        newNullIn.scale.setValue([handleScale,handleScale]);
                        newNullIn.shy = true;

                        var newNullOut = createHandleFunction(comp);
                        newNullOut.parent = newNull;
                        newNullOut.position.setValue(pathOutTangents[i]);
                        newNullOut.position.expression =
                                "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                                "var srcPath = srcLayer" + pathPath + ".outTangents()[" + i + "]; \r" +
                                "srcPath;";
                        newNullOut.name = nullNameIn;
                        newNullOut.label = 14;
                        newNullOut.scale.setValue([handleScale,handleScale]);
                        newNullOut.shy = true;

                        newNull.moveBefore(newNullOut);
                    }
                }
            }
        });
        app.endUndoGroup();
    }

    function linkPointsToNulls(suppressUndo, layers){
        var undoGroup = localize("$$$/AE/Script/CreatePathNulls/LinkPathPointsToNulls=Link Path Points to Nulls");
        if(!suppressUndo) app.beginUndoGroup(undoGroup);

        forEachPath(function(comp,selectedLayer,path){
            // Get property path to path
            var createControlsForHandles = getCreateControlsForHandles();
            var pathHierarchy = [];
            var pathPath = getPropPath(path, pathHierarchy);
            var nullSet = [];
            var nullSetIn = [];
            var nullSetOut = [];
            // Creation functions to use
            var createPointFunction = getUseLocators() ? createPointLocator : createNull;
            var createHandleFunction = getUseLocators() ? createHandleLocator : createNull;
            var handleScale = getUseLocators() ? 100 : 50;
            // Do things with the path points
            var pathPoints = getPathPoints(path);
            var pathInTangents = getPathInTangents(path);
            var pathOutTangents = getPathOutTangents(path);

            for (var i = 0, ii = pathPoints.length; i < ii; i++){ //For each path point
                var nullName = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "]";
                var nullNameIn = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "][In]";
                var nullNameOut = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "][Out]";

                if(layers)
                {
                    nullName = layers[i].name+"-"+nullName;
                }

                nullSet.push(nullName);
                nullSetIn.push(nullNameIn);
                nullSetOut.push(nullNameOut);

                // Get names of nulls that don't exist yet and create them
                if(comp.layer(nullName) == undefined){

                    if(!layers)
                    {
                        //Create nulls
                        var newNull = createPointFunction(comp);
                    }
                    else
                    {
                        newNull = layers[i];
                    }

                    // Null layer name
                    newNull.name = nullName;
                    newNull.label = 11;
                    

                    if(createControlsForHandles)
                    {
                        var newNullIn = createHandleFunction(comp);
                        var newNullOut = createHandleFunction(comp);
                        newNullIn.parent = newNull;
                        newNullOut.parent = newNull;
                        newNullIn.name = nullNameIn;
                        newNullOut.name = nullNameOut;
                        newNullIn.label = 14;
                        newNullOut.label = 14;
                        newNullIn.scale.setValue([handleScale,handleScale]);
                        newNullOut.scale.setValue([handleScale,handleScale]);
                        newNullOut.shy = newNullIn.shy = true;
                        newNull.moveBefore(newNullOut);
                    }

                    // Set position using layer space transforms, then remove expressions
                    newNull.position.setValue(pathPoints[i]);
                    newNull.position.expression =
                            "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                            "var srcPath = srcLayer" + pathPath + ".points()[" + i + "]; \r" +
                            "srcLayer.toComp(srcPath);";
                    newNull.position.setValue(newNull.position.value);
                    newNull.position.expression = '';

                    if(createControlsForHandles)
                    {
                        newNullIn.position.setValue(pathInTangents[i]);
                        newNullOut.position.setValue(pathOutTangents[i]);
                    }
                }

            }

            // Get any existing Layer Control effects
            var existingEffects = [];
            forEachEffect(selectedLayer,function(targetEffect){
                if(matchMatchName(targetEffect,"ADBE Layer Control") != null) {
                    existingEffects.push(targetEffect.name);
                }
            });

            // Add new layer control effects for each null
            for(var n = 0; n < nullSet.length;n++){
                if(existingEffects.join("|").indexOf(nullSet[n]) != -1){ //If layer control effect exists, relink it to null
                    selectedLayer.property("ADBE Effect Parade")(nullSet[n]).property("ADBE Layer Control-0001").setValue(comp.layer(nullSet[n]).index);
                    if(createControlsForHandles) selectedLayer.property("ADBE Effect Parade")(nullSetIn[n]).property("ADBE Layer Control-0001").setValue(comp.layer(nullSetIn[n]).index);
                    if(createControlsForHandles) selectedLayer.property("ADBE Effect Parade")(nullSetOut[n]).property("ADBE Layer Control-0001").setValue(comp.layer(nullSetOut[n]).index);
                } else {
                    var newControl = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                    newControl.name = nullSet[n];
                    newControl.property("ADBE Layer Control-0001").setValue(comp.layer(nullSet[n]).index);

                    if(createControlsForHandles)
                    {
                        var newControlIn = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                        newControlIn.name = nullSetIn[n];
                        newControlIn.property("ADBE Layer Control-0001").setValue(comp.layer(nullSetIn[n]).index);

                        var newControlOut = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                        newControlOut.name = nullSetOut[n];
                        newControlOut.property("ADBE Layer Control-0001").setValue(comp.layer(nullSetOut[n]).index);
                    }
                }
            }

            // Set path expression that references nulls
            if(createControlsForHandles)
            {
                path.expression =
                        "var nullLayerNames = [\"" + nullSet.join("\",\"") + "\"]; \r" +
                        "var nullLayerNamesIn = [\"" + nullSetIn.join("\",\"") + "\"]; \r" +
                        "var nullLayerNamesOut = [\"" + nullSetOut.join("\",\"") + "\"]; \r" +
                        "var origPath = thisProperty; \r" +
                        "var origPoints = origPath.points(); \r" +
                        "var origInTang = origPath.inTangents(); \r" +
                        "var origOutTang = origPath.outTangents(); \r" +
                        "var getNullLayers = []; \r" +
                        "var getNullLayersIn = []; \r" +
                        "var getNullLayersOut = []; \r" +
                        "for (var i = 0; i < nullLayerNames.length; i++){ \r" +
                        "    try{  \r" +
                        "        getNullLayers.push(effect(nullLayerNames[i])(\"ADBE Layer Control-0001\")); \r" +
                        "        getNullLayersIn.push(effect(nullLayerNamesIn[i])(\"ADBE Layer Control-0001\")); \r" +
                        "        getNullLayersOut.push(effect(nullLayerNamesOut[i])(\"ADBE Layer Control-0001\")); \r" +
                        "    } catch(err) { \r" +
                        "        getNullLayers.push(null); \r" +
                        "    }} \r" +
                        "for (var i = 0; i < getNullLayers.length; i++){ \r" +
                        "    if (getNullLayers[i] != null && getNullLayers[i].index != thisLayer.index){ \r" +
                        "        origPoints[i] = fromCompToSurface(getNullLayers[i].toComp(getNullLayers[i].anchorPoint));  \r" +
                        "        origInTang[i] = fromCompToSurface(getNullLayersIn[i].toComp(getNullLayersIn[i].anchorPoint)) - origPoints[i];  \r" +
                        "        origOutTang[i] = fromCompToSurface(getNullLayersOut[i].toComp(getNullLayersOut[i].anchorPoint)) - origPoints[i];  \r" +
                        "    }} \r" +
                        "createPath(origPoints,origInTang,origOutTang,origPath.isClosed());";
            }
            else
            {
                path.expression =
                        "var nullLayerNames = [\"" + nullSet.join("\",\"") + "\"]; \r" +
                        "var origPath = thisProperty; \r" +
                        "var origPoints = origPath.points(); \r" +
                        "var origInTang = origPath.inTangents(); \r" +
                        "var origOutTang = origPath.outTangents(); \r" +
                        "var getNullLayers = []; \r" +
                        "var getNullLayersIn = []; \r" +
                        "var getNullLayersOut = []; \r" +
                        "for (var i = 0; i < nullLayerNames.length; i++){ \r" +
                        "    try{  \r" +
                        "        getNullLayers.push(effect(nullLayerNames[i])(\"ADBE Layer Control-0001\")); \r" +
                        "    } catch(err) { \r" +
                        "        getNullLayers.push(null); \r" +
                        "    }} \r" +
                        "for (var i = 0; i < getNullLayers.length; i++){ \r" +
                        "    if (getNullLayers[i] != null && getNullLayers[i].index != thisLayer.index){ \r" +
                        "        origPoints[i] = fromCompToSurface(getNullLayers[i].toComp(getNullLayers[i].anchorPoint));  \r" +
                        "    }} \r" +
                        "createPath(origPoints,origInTang,origOutTang,origPath.isClosed());";
            }

        });
        if(!suppressUndo) app.endUndoGroup();
    }

    function tracePath(){
        var undoGroup = localize("$$$/AE/Script/CreatePathNulls/CreatePathTracerNull=Create Path Tracer Null");
        app.beginUndoGroup(undoGroup);

        var sliderName = localize("$$$/AE/Script/CreatePathNulls/TracerTiming=Tracer Timing");
        var checkboxName = localize("$$$/AE/Script/CreatePathNulls/LoopTracer=Loop Tracer");

        forEachPath(function(comp,selectedLayer,path){
            var pathHierarchy = [];
            var pathPath = getPropPath(path, pathHierarchy);

            // Create tracer null
            var newNull = createNull(comp);

            // Add expression control effects to the null
            var nullControl = newNull.property("ADBE Effect Parade").addProperty("Pseudo/ADBE Trace Path");
            nullControl.property("Pseudo/ADBE Trace Path-0002").setValue(true);
            nullControl.property("Pseudo/ADBE Trace Path-0001").setValuesAtTimes([0,1],[0,100]);
            nullControl.property("Pseudo/ADBE Trace Path-0001").expression =
                        "if(thisProperty.propertyGroup(1)(\"Pseudo/ADBE Trace Path-0002\") == true && thisProperty.numKeys > 1){ \r" +
                        "thisProperty.loopOut(\"cycle\"); \r" +
                        "} else { \r" +
                        "value \r" +
                        "}";
            newNull.position.expression =
                    "var pathLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                    "var progress = thisLayer.effect(\"Pseudo/ADBE Trace Path\")(\"Pseudo/ADBE Trace Path-0001\")/100; \r" +
                    "var pathToTrace = pathLayer" + pathPath + "; \r" +
                    "pathLayer.toComp(pathToTrace.pointOnPath(progress));";
            newNull.rotation.expression =
                    "var pathToTrace = thisComp.layer(\"" + selectedLayer.name + "\")" + pathPath + "; \r" +
                    "var progress = thisLayer.effect(\"Pseudo/ADBE Trace Path\")(\"Pseudo/ADBE Trace Path-0001\")/100; \r" +
                    "var pathTan = pathToTrace.tangentOnPath(progress); \r" +
                    "radiansToDegrees(Math.atan2(pathTan[1],pathTan[0]));";
            newNull.name = "Trace " + selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "]";
            newNull.label = 10;

        });
        app.endUndoGroup();
    }

    function createPathFromNSelected(layerName, cornerType, smoothness, closePath)
    {
        var undoGroup = localize("$$$/AE/Script/CreatePathNulls/CreatePathTracerNull=Create Path From Selected");
        app.beginUndoGroup(undoGroup);

        var comp = getActiveComp();
        var layers = getSelectedLayers(comp);
        var bottomLayer = layers[0];

        if(layers.length<2)
        {
            alert("Please select two layers or more");
            return;
        }

        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = layerName;
        var shapeGroup = shapeLayer.property("Contents").addProperty("ADBE Vector Group");
        shapeGroup.name = "Group";

        var vertices = [];
        var inTangents = [];
        var outTangents = [];

        var bezierSmoothness = cornerType=="Bezier"?smoothness:0;

        for(var i=0;i<layers.length;i++)
        {
            vertices[i] = [layers[i].position.value[0]-comp.width/2, layers[i].position.value[1]-comp.height/2];
            inTangents[i] = [bezierSmoothness, 0];
            outTangents[i] = [-bezierSmoothness, 0];
            
            bottomLayer = bottomLayer.index<layers[i].index?layers[i]:bottomLayer;
        }
        
        var pathShape = new Shape();
        pathShape.vertices = vertices;
        pathShape.inTangents = inTangents;
        pathShape.outTangents = outTangents;
        pathShape.closed = closePath;

        var pathGroup = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Group");
        pathGroup.property("Path").setValue(pathShape);

        var pathStroke = shapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
        pathStroke.property("Color").setValue([0,0,0]);
        pathStroke.property("Stroke Width").setValue(4);

        var contents = shapeGroup.property("Contents");
        var pathIndex = contents.numProperties-1;

        if(cornerType=="Smooth")
        {
            var roundCorners = shapeGroup.property("Contents").addProperty("ADBE Vector Filter - RC");
            roundCorners.property("Radius").setValue(smoothness);

            pathIndex = contents.numProperties-2;
        }
        
        var pathGroup = contents.property(pathIndex);
        pathGroup.property("Path").selected = true;

        shapeLayer.moveAfter(bottomLayer);

        linkPointsToNulls(true, layers);

        app.endUndoGroup();
    }

})(this);