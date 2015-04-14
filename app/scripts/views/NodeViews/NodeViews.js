define(['BaseNodeView', 'WatchNodeView', 'NumNodeView', 'ThreeCSGNodeView', 'FormulaView', 'OutputView', 'InputView','CustomNodeView', 'InputStringView', 'SelectView', 'QueryView', 'ThreeModelView'], 
  function(BaseNodeView, WatchNodeView, NumNodeView, ThreeCSGNodeView, FormulaView, OutputView, InputView, CustomNodeView, InputStringView, SelectView, QueryView, ThreeModelView){

  var nodeViewTypes = {};

  nodeViewTypes.Base = ThreeCSGNodeView;
  nodeViewTypes.Show = WatchNodeView;
  nodeViewTypes.Number = NumNodeView;
  
  nodeViewTypes.InputString = InputStringView;
  nodeViewTypes.GetSerializer = SelectView;
  nodeViewTypes.GetProject = SelectView;
  nodeViewTypes.GetRevision = SelectView;

  nodeViewTypes.GetRevision = ThreeModelView;
  nodeViewTypes.Query = ThreeModelView;
  nodeViewTypes.MergeModels = ThreeModelView;

  nodeViewTypes.CustomNode = CustomNodeView;

  nodeViewTypes.Script = FormulaView;
  nodeViewTypes.Input = InputView;
  nodeViewTypes.Output = OutputView;

  return nodeViewTypes;

});