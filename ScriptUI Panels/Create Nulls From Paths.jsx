/*
    Create Nulls From Paths.jsx v.0.6
    Attach nulls to shape and mask vertices, and vice-versa.

    Changes 0.6:
        - Nulls are now created above the selected layer.
        - Loop optimizations

    Changes 0.5:
        - wraps it all in an IIFE
        - fixes call to missing method array.indexOf
*/
(function createNullsFromPaths (thisObj) {
    /* Build UI */
    function buildUI(thisObj) {

        var windowTitle = localize("$$$/AE/Script/CreatePathNulls/CreateNullsFromPaths=Create Nulls From Paths");
        var firstButton = localize("$$$/AE/Script/CreatePathNulls/PathPointsToNulls=Points Follow Nulls");
        var secondButton = localize("$$$/AE/Script/CreatePathNulls/NullsToPathPoints=Nulls Follow Points");
        var thirdButton = localize("$$$/AE/Script/CreatePathNulls/TracePath=Trace Path");
        var win = (thisObj instanceof Panel)? thisObj : new Window('palette', windowTitle);
            win.spacing = 0;
            win.margins = 4;
            var myButtonGroup = win.add ("group");
                myButtonGroup.spacing = 4;
                myButtonGroup.margins = 0;
                myButtonGroup.orientation = "row";
                win.button1 = myButtonGroup.add ("button", undefined, firstButton);
                win.button2 = myButtonGroup.add ("button", undefined, secondButton);
                win.button3 = myButtonGroup.add ("button", undefined, thirdButton);
                myButtonGroup.alignment = "center";
                myButtonGroup.alignChildren = "center";

            win.button1.onClick = function(){
                linkPointsToNulls();
            }
            win.button2.onClick = function(){
                linkNullsToPoints();
            }
            win.button3.onClick = function(){
                tracePath();
            }

        win.layout.layout(true);

        return win
    }


    // Show the Panel
    var w = buildUI(thisObj);
    if (w.toString() == "[object Panel]") {
        w;
    } else {
        w.show();
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

            for (var p = 0, pl = selectedPaths.length; p < pl; p++) {
                    doSomething(comp,parentLayers[p],selectedPaths[p]);
            }

    }

    function linkNullsToPoints(){
        var undoGroup = localize("$$$/AE/Script/CreatePathNulls/LinkNullsToPathPoints=Link Nulls to Path Points");
        app.beginUndoGroup(undoGroup);

        forEachPath(function(comp,selectedLayer,path){
            var pathHierarchy = [];
            var pathPath = getPropPath(path, pathHierarchy);
            // Do things with the path points
            var pathPoints = getPathPoints(path);
            for (var i = 0, ii = pathPoints.length; i < ii; i++){
                var nullName = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "]";
                if(comp.layer(nullName) == undefined){
                    var newNull = createNull(comp);
                    newNull.moveBefore(selectedLayer);
                    newNull.position.setValue(pathPoints[i]);
                    newNull.position.expression =
                            "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                            "var srcPath = srcLayer" + pathPath + ".points()[" + i + "]; \r" +
                            "srcLayer.toComp(srcPath);";
                    newNull.name = nullName;
                    newNull.label = 10;
                    }
                }
        });
        app.endUndoGroup();
    }

    function linkPointsToNulls(){
        var undoGroup = localize("$$$/AE/Script/CreatePathNulls/LinkPathPointsToNulls=Link Path Points to Nulls");
        app.beginUndoGroup(undoGroup);

        forEachPath(function(comp,selectedLayer,path){
            // Get property path to path
            var pathHierarchy = [];
            var pathPath = getPropPath(path, pathHierarchy);
            var nullSet = [];
            // Do things with the path points
            var pathPoints = getPathPoints(path);
            for (var i = 0, ii = pathPoints.length; i < ii; i++){ //For each path point
                var nullName = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "]";
                nullSet.push(nullName);

                // Get names of nulls that don't exist yet and create them
                if(comp.layer(nullName) == undefined){

                    //Create nulls
                    var newNull = createNull(comp);
                    newNull.moveBefore(selectedLayer);
                    // Null layer name
                    newNull.name = nullName;
                    newNull.label = 11;

                    // Set position using layer space transforms, then remove expressions
                    newNull.position.setValue(pathPoints[i]);
                    newNull.position.expression =
                            "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                            "var srcPath = srcLayer" + pathPath + ".points()[" + i + "]; \r" +
                            "srcLayer.toComp(srcPath);";
                    newNull.position.setValue(newNull.position.value);
                    newNull.position.expression = '';
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
            for(var n = 0, nl = nullSet.length; n < nl; n++){
                if(existingEffects.join("|").indexOf(nullSet[n]) != -1){ //If layer control effect exists, relink it to null
                    selectedLayer.property("ADBE Effect Parade")(nullSet[n]).property("ADBE Layer Control-0001").setValue(comp.layer(nullSet[n]).index);
                } else {
                    var newControl = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                    newControl.name = nullSet[n];
                    newControl.property("ADBE Layer Control-0001").setValue(comp.layer(nullSet[n]).index);
                }
            }

            // Set path expression that references nulls
            path.expression =
                        "var nullLayerNames = [\"" + nullSet.join("\",\"") + "\"]; \r" +
                        "var origPath = thisProperty; \r" +
                        "var origPoints = origPath.points(); \r" +
                        "var origInTang = origPath.inTangents(); \r" +
                        "var origOutTang = origPath.outTangents(); \r" +
                        "var getNullLayers = []; \r" +
                        "for (var i = 0, il = nullLayerNames.length; i < il; i++){ \r" +
                        "    try{  \r" +
                        "        getNullLayers.push(effect(nullLayerNames[i])(\"ADBE Layer Control-0001\")); \r" +
                        "    } catch(err) { \r" +
                        "        getNullLayers.push(null); \r" +
                        "    }} \r" +
                        "for (var i = 0, il = getNullLayers.length; i < il; i++){ \r" +
                        "    if (getNullLayers[i] != null && getNullLayers[i].index != thisLayer.index){ \r" +
                        "        origPoints[i] = fromCompToSurface(getNullLayers[i].toComp(getNullLayers[i].anchorPoint));  \r" +
                        "    }} \r" +
                        "createPath(origPoints,origInTang,origOutTang,origPath.isClosed());";

        });
        app.endUndoGroup();
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
            newNull.moveBefore(selectedLayer);

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

})(this);
