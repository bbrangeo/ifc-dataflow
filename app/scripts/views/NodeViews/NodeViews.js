define(['BaseNodeView', 'WatchNodeView', 'NumNodeView', 'ThreeCSGNodeView', 'FormulaView', 'OutputView', 'InputView','CustomNodeView', 'InputStringView', 'SelectView', 'QueryView', 'ThreeModelView', 'Select3dView'], 
  function(BaseNodeView, WatchNodeView, NumNodeView, ThreeCSGNodeView, FormulaView, OutputView, InputView, CustomNodeView, InputStringView, SelectView, QueryView, ThreeModelView, Select3dView){

  var nodeViewTypes = {};

  nodeViewTypes.Base = ThreeCSGNodeView;
  nodeViewTypes.Show = WatchNodeView;
  nodeViewTypes.Number = NumNodeView;
  
  nodeViewTypes.InputString = InputStringView;
  nodeViewTypes.GetSerializer = SelectView;
  nodeViewTypes.GetProject = SelectView;
  nodeViewTypes.GetRevision = SelectView;

  //nodeViewTypes.GetRevision = Select3dView;
  nodeViewTypes.Query = ThreeModelView;
  nodeViewTypes.MergeModels = ThreeModelView;
  nodeViewTypes.mvdXML = ThreeModelView;
  
  nodeViewTypes.CustomNode = CustomNodeView;

  nodeViewTypes.Script = FormulaView;
  nodeViewTypes.Input = InputView;
  nodeViewTypes.Output = OutputView;

  return nodeViewTypes;

});