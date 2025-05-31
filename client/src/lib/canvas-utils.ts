import Konva from 'konva';

export function exportCanvasAsPNG(stage: Konva.Stage): string {
  return stage.toDataURL({ pixelRatio: 2 });
}

export function exportCanvasAsPDF(stage: Konva.Stage): void {
  // For a production app, you would integrate with a library like jsPDF
  // For now, we'll download as PNG
  const dataURL = exportCanvasAsPNG(stage);
  downloadImage(dataURL, 'whiteboard.png');
}

export function downloadImage(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function fitStageToWindow(stage: Konva.Stage): void {
  const container = stage.container();
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  
  stage.width(containerWidth);
  stage.height(containerHeight);
  stage.batchDraw();
}

export function getRelativePointerPosition(stage: Konva.Stage) {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const pos = stage.getPointerPosition();
  return pos ? transform.point(pos) : null;
}

export function zoomStage(stage: Konva.Stage, scaleBy: number) {
  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();
  
  if (!pointer) return;
  
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };
  
  const newScale = Math.max(0.1, Math.min(oldScale * scaleBy, 5));
  
  stage.scale({ x: newScale, y: newScale });
  
  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };
  
  stage.position(newPos);
  stage.batchDraw();
}
