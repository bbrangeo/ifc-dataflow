define(['BaseNodeView', 'WatchNodeView', 'NumNodeView', 'ThreeCSGNodeView', 'FormulaView', 'OutputView', 'InputView','CustomNodeView', 'InputStringView', 'SelectView'], 
  function(BaseNodeView, WatchNodeView, NumNodeView, ThreeCSGNodeView, FormulaView, OutputView, InputView, CustomNodeView, InputStringView, SelectView){

  var nodeViewTypes = {};

  nodeViewTypes.Base = ThreeCSGNodeView;
  nodeViewTypes.Show = WatchNodeView;
  nodeViewTypes.Number = NumNodeView;
  nodeViewTypes.InputString = InputStringView;
  nodeViewTypes.GetSerializer = SelectView;
  nodeViewTypes.CustomNode = CustomNodeView;

  nodeViewTypes.Script = FormulaView;
  nodeViewTypes.Input = InputView;
  nodeViewTypes.Output = OutputView;

  return nodeViewTypes;

});