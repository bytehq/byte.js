var render = function (post) {
    var bff = post['package'];
    var objects = bff['objects'];

    var getColorFromArray = function (array, alpha) {
        array = array || [0, 0, 0, 1.0];
        var color = 'rgba(' +   parseInt(array[0] * 255) + ', ' +
                                parseInt(array[1] * 255) + ', ' +
                                parseInt(array[2] * 255) + ', ' +
                                (alpha || (array[3])) + ')';
        return color;
    }

    var getAspectFrame = function (type, parentWidth, parentHeight, childWidth, childHeight) {
        var parentAspect = parentWidth / parentHeight;
        var childAspect = childWidth / childHeight;
        var ratio;

        if (type == 'fill') {
            if (parentAspect > childAspect) {
                ratio = parentWidth / childWidth;
            } else {
                ratio = parentHeight / childHeight;
            }
        } else {
            if (parentAspect > childAspect) {
                ratio = parentHeight / childHeight;
            } else {
                ratio = parentWidth / childWidth;
            }
        }

        var targetW = childWidth * ratio;
        var targetH = childHeight * ratio;

        return [
            parentWidth / 2 - targetW / 2,
            parentHeight / 2 - targetH / 2,
            targetW,
            targetH
        ];
    }

    var getFontNameForStyle = function (style) {
        switch (style) {
            case 'sans':
                return 'Helvetica';
                break;
            case 'serif':
                return 'Georgia';
                break;
            case 'mono':
                return 'Courier';
                break;
            case 'eightbit':
                return 'Courier';
                break;
            case 'poster':
                return 'Impact';
                break;
        }

        return 'Helvetica';
    }

    var bg = bff['background'];
    var $rootNode = $('<div class="byte" style="background: linear-gradient(' + getColorFromArray(bg[0]) + ', ' + getColorFromArray(bg[1]) + ')">');
    $rootNode
        .css('width', 324)
        .css('height', 570)
        .css('overflow', 'hidden')
        .css('display', 'block')
        .css('position', 'relative');

    objects.forEach(function (object, index) {

        var $node;
        var frame = object['frame'];
        var transform = object['transform'];

        switch (object['type']) {
            case 'graphic':
                $node = $('<div>');
                var $image = $('<img style="position: absolute;" src="' + object['src'] + '">');
                $image.load(function () {
                    var aspectFrame = getAspectFrame(object['scaleMode'] || 'fit', frame[2], frame[3], $image.width(), $image.height());
                    $image
                        .css('left', aspectFrame[0])
                        .css('top', aspectFrame[1])
                        .css('width', aspectFrame[2])
                        .css('height', aspectFrame[3])
                });
                $node.append($image);
                break;

            case 'image':
            case 'gif':
                $node = $('<div>');
                var $image = $('<img style="position: absolute;" src="' + object['src'] + '">');
                $image.load(function () {
                    var aspectFrame = getAspectFrame(object['scaleMode'] || 'fill', frame[2], frame[3], $image.width(), $image.height());
                    $image
                        .css('left', aspectFrame[0])
                        .css('top', aspectFrame[1])
                        .css('width', aspectFrame[2])
                        .css('height', aspectFrame[3])
                });
                $node.append($image);

                break;

            case 'text':
                console.log(object);
                $node = $('<div>');

                var words = object['text'].split(' ');
                var text = '';
                var wordCountForCurrentLine = 0;
                words.forEach(function (word, index) {
                    if (wordCountForCurrentLine >= 5) {
                        wordCountForCurrentLine = 0;
                        text += '\n';
                    } else {
                        if (index > 0) {
                            text += ' ';
                        }
                    }

                    text += word;
                    wordCountForCurrentLine++;
                });

                var lines = text.split('\n');

                var $canvas = $('<canvas>')
                var context = $canvas[0].getContext('2d');
                $canvas[0].width = frame[2];
                $canvas[0].height = frame[3];
                context.font = '100px ' + getFontNameForStyle(object['style']);
                context.textAlign = 'center';
                context.textBaseline = 'top';
                context.fillStyle = getColorFromArray(object['color']);

                var highestLineWidth = 0;
                var yOffset = 0;

                lines.forEach(function (line, index) {
                    var dimensions = context.measureText(line);
                    if (dimensions.width > highestLineWidth) {
                        highestLineWidth = dimensions.width;
                    }

                    yOffset += dimensions.actualBoundingBoxAscent + dimensions.actualBoundingBoxDescent;
                });

                var widthRatio = (frame[2] - 40) / highestLineWidth;
                var heightRatio = (frame[3] - 20) / yOffset;
                var ratio = Math.min(widthRatio, heightRatio);

                var fontSize = (100 * ratio);
                var estimatedHeight = fontSize * lines.length;
                context.font = fontSize + 'px ' + getFontNameForStyle(object['style']);

                lines.forEach(function (line, index) {
                    context.fillText(line, frame[2] / 2, (frame[3] / 2 - estimatedHeight / 2) + index * fontSize);
                });

                $node.append($canvas);
                break;

            case 'paragraph':
                frame = [
                    frame[0] + 20,
                    frame[1] + 20,
                    frame[2] - 40,
                    frame[3] - 40
                ];

                $node = $('<p>');
                $node.css('font-family', getFontNameForStyle(object['style']));
                $node.css('font-size', object['size'] || 17);
                $node.css('color', getColorFromArray(object['color']));
                $node.css('box-sizing', 'border-box');
                $node.css('text-align', object['alignment'] || 'left');
                $node.html(object['text'].replace(/(?:\r\n|\r|\n)/g, '<br>'));
                break;

            case 'video':
                $node = $('<video muted loop autoplay>');
                $node[0].width = frame[2];
                $node[0].height = frame[3];
                $node.append('<source src="' + object['src'] + '" type="video/mp4">');
                break;

            case 'link':

                frame = [
                    frame[0] + 5,
                    frame[1] + 5,
                    frame[2] - 10,
                    frame[3] - 10
                ];

                $node = $('<a style="display: block" href="' + object['url'] + '">' + object['title'] + '</a>');
                $node.css('border', '2px solid ' + getColorFromArray(object['color']));
                $node.css('color', getColorFromArray(object['color']));
                $node.css('box-sizing', 'border-box');
                $node.css('border-radius', 6);
                $node.css('text-align', 'center');
                $node.css('text-decoration', 'none');
                $node.css('line-height', (frame[3] - 3) + 'px');
                $node.css('font-family', 'Helvetica');
                $node.css('font-weight', 600);

                $node.mouseover(function () {
                    $node.css('background', getColorFromArray(object['color'], 0.5));
                });

                $node.mouseout(function () {
                    $node.css('background', 'none');
                });
                break;
        }


        if ($node) {
            $node.addClass('node');
            $node
                .css('overflow', 'hidden')
                .css('position', 'absolute')
                .css('left', frame[0])
                .css('top', frame[1])
                .css('width', frame[2])
                .css('height', frame[3]);

            if (transform) {
                var transformString = [
                    transform[0][0],
                    transform[0][1],
                    transform[1][0],
                    transform[1][1],
                    transform[2][0],
                    transform[2][1]
                ].join(', ');
                $node.css('transform', 'matrix(' + transformString + ')');
            }

            $rootNode.append($node);
        }

    });

    return $rootNode;
}

window.ByteRenderer = {
    render: render
};