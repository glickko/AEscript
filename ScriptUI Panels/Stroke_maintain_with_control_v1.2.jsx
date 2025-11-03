(function() {  
    // Get active composition;  
    var composition = app.project.activeItem;  
    if (!composition || !(composition instanceof CompItem))  
        return alert("Please select composition first");  
  
  
    // Get selected Layers  
    var selectedLayers = composition.selectedLayers;  
    if (selectedLayers.length === 0) {  
        return alert("Please select some layers");  
    }  
  
  
    app.beginUndoGroup("Add Keyframes");  
  
  var keyState = ScriptUI.environment.keyboardState;  
    var layer, shapeProperties;  
    // For each selected layer  
    for (var i = 0, il = selectedLayers.length; i < il; i++) {  
        layer = selectedLayers[i];  
         
        // Get "ADBE Vector Shape" properties  
        shapeProperties = getProperties(layer, "ADBE Vector Stroke Width");  
  
  
        // Loop through all "ADBE Vector Shape" properties and do your magic  
        for (var j = 0, jl = shapeProperties.length; j < jl; j++) {  

           shapeProperties[j].expression = "s = scale[0];\rL = thisLayer;\rwhile (L.hasParent){\rs = s*L.parent.scale[0]/100;\rL = L.parent;\r}\rscaleFactor = 100/s;\rthisComp.layer(\"Control Stroke\")(\"ADBE Effect Parade\")(\"ADBE Slider Control\")(\"ADBE Slider Control-0001\")*scaleFactor;";

        }  
    }  
  
  
    app.endUndoGroup();  
  
  
    // Recursive function to find properties by matchName  
    function getProperties(currentProperty, propertyMatchName, propsArray) {  
        propsArray = propsArray || [];  
        for (var i = 1, il = currentProperty.numProperties; i <= il; i++) {  
            if (currentProperty.property(i).matchName === propertyMatchName) {  
                propsArray.push(currentProperty.property(i));  
            }  
            getProperties(currentProperty.property(i), propertyMatchName, propsArray);  
        }  
        return propsArray;  
    }  
if (composition.layer("Control Stroke") == null){

var myNull=composition.layers.addNull();
myNull.name="Control Stroke";
myNull.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
var myProps = myNull.selectedProperties;
myNull.property("ADBE Effect Parade").property(1).property("ADBE Slider Control-0001").setValue(3);
myNull.property("ADBE Effect Parade").property(1).name = "Stroke";

}else{

}

})();  