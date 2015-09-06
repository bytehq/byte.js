/*

The MIT License (MIT)

Copyright (c) 2015 Ryan Sturmer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

// Copy off the old measurement function (we'll need it)
CanvasRenderingContext2D.prototype._measureText = CanvasRenderingContext2D.prototype.measureText;

// This was inspired by StackOverflow answer:
// http://stackoverflow.com/questions/11452022/measure-text-height-on-an-html5-canvas-element
CanvasRenderingContext2D.prototype.measureText = function(text) {
	metrics = this._measureText(text);

	var text = document.createElement('span');
	text.innerHTML = 'Hg';
	text.style['font'] = this.font

	var block = document.createElement("div");
	block.style['display'] = 'inline-block';
	block.style['width'] = '1px';
	block.style['height'] = '0px';

	var div = document.createElement('div');
	div.appendChild(text);
	div.appendChild(block);

	var body = document.body;
	body.appendChild(div);

	var ascent = -1;
	var descent = -1;
	var height = -1;

	try {
		block.style['vertical-align'] = 'baseline';
		ascent = block.offsetTop - text.offsetTop;
		block.style['vertical-align'] = 'bottom';
		height = block.offsetTop - text.offsetTop;
		descent = height - ascent;
	} finally {
		document.body.removeChild(div);
	}

	new_metrics = {}

	// TODO This doesn't account for locale, and is guaranteed broken for those that read right-to-left
	switch(this.textAlign) {
		case "start":
		case "left":
			new_metrics.actualBoundingBoxLeft = 0;
			new_metrics.actualBoundingBoxRight = metrics.width;
			break;

		case "end":
		case "right":
			new_metrics.actualBoundingBoxLeft = -metrics.width;
			new_metrics.actualBoundingBoxRight = 0;
			break;

		case "center":
			// TODO This is probably just an approximation.
			new_metrics.actualBoundingBoxLeft = -metrics.width/2.0;
			new_metrics.actualBoundingBoxRight = metrics.width/2.0;
			break;
	}
	new_metrics.actualBoundingBoxAscent = ascent;
	new_metrics.actualBoundingBoxDescent = descent;

	// Copy the new metrics over, if and only if the CanvasRenderingContext2D API doesn't provide them
	for(key in new_metrics) {
		if(!(key in metrics)) {
			metrics[key] = new_metrics[key];
		}
	}

	return metrics;
}
