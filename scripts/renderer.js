$.fn.textWidth = function(){
  var html_org = $(this).html();
  var html_calc = '<span>' + html_org + '</span>';
  $(this).html(html_calc);
  var width = $(this).find('span:first').width();
  $(this).html(html_org);
  return width;
};

var getColorFromArray = function (array, alpha) {
    array = array || [0, 0, 0, 1.0];
    var color = 'rgba(' +   parseInt(array[0] * 255) + ', ' +
                            parseInt(array[1] * 255) + ', ' +
                            parseInt(array[2] * 255) + ', ' +
                            (alpha || (array[3])) + ')';
    return color;
};

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
};

var getFontNameForStyle = function (style) {
    switch (style) {
        case 'sans':
            return 'Helvetica, Arial';
            break;
        case 'serif':
            return 'Georgia, Times New Roman';
            break;
        case 'mono':
            return 'Roboto';
            break;
        case 'eightbit':
            return 'PixelGrotesk';
            break;
        case 'poster':
            return 'Pressuru';
            break;
        case 'cursive':
            return 'LeagueScript';
            break;
        case 'punchout':
            return 'Labeler';
            break;
        case 'book':
            return 'st32k';
            break;
        case 'tape':
            return 'Alfphabet IV';
            break;
    }

    return 'Helvetica';
};

var render = function (post) {
    var bff = post['package'];
    var objects = bff['objects'];

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
        var opacity = object['opacity'];

        switch (object['type'].toLowerCase()) {
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
                $node = $('<div>');

                var isBold = object['style'] == 'sans' || object['style'] == 'serif';

                // determine where line breaks should occur
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


                // this is a bit of a doozy, let's take it step by step:
                // we lay out every line of text as a separate element, so split on \n
                var lines = text.split('\n');

                // this array will hold each span element that's tied to a line
                var lineElements = [];

                // we use <canvas> for measuring the dimensions of each line
                var $canvas = $('<canvas>')
                var context = $canvas[0].getContext('2d');
                $canvas[0].width = frame[2];
                $canvas[0].height = frame[3];
                context.font = (isBold ? 'bold ' : '') + '100px ' + getFontNameForStyle(object['style']);
                context.textAlign = 'center';
                context.textBaseline = 'top';

                // set up the initial <span> elements
                lines.forEach(function (line, index) {
                    var $line = $('<span>' + line + '</span>');
                    $line.css('text-align', 'center');
                    $line.css('white-space', 'nowrap');
                    $line.css('position', 'absolute');
                    $line.css('font-family', getFontNameForStyle(object['style']));

                    // use a baseline font size of 100; we'll scale up or down from here to fit the bounding box later
                    $line.css('font-size', 100);
                    $line.css('color', getColorFromArray(object['color']));
                    if (isBold) {
                        $line.css('font-weight', 600);
                    }

                    lineElements.push($line);
                    $node.append($line);
                });
                
                // TODO: Remove these nasty timeouts and use actual event listener for font loading
                setTimeout(function () {

                    // we need to determine the width and height of the sum of all the lines
                    var highestLineWidth = 0;
                    var height = 0;

                    lineElements.forEach(function ($line, index) {
                        var dimensions = context.measureText($line.text());
                        if (dimensions.width > highestLineWidth) {
                            highestLineWidth = dimensions.width;
                        }

                        height += dimensions.actualBoundingBoxAscent + dimensions.actualBoundingBoxDescent;
                    });

                    // determine a scaling ratio based on the bounding box and the sum width/height
                    var widthRatio = (frame[2] - 40) / highestLineWidth;
                    var heightRatio = (frame[3] - 20) / height;
                    var ratio = Math.min(widthRatio, heightRatio);


                    // scale the font size of each line element by the ratio
                    lineElements.forEach(function ($line, index) {
                        $line.css('display', 'inline-block');
                        $line.css('width', frame[2]);
                        $line.css('font-size', 100 * ratio);
                    });

                    setTimeout(function () {
                        // do another pass and determine the NEW width/heights of the lines
                        // now that they have been resized
                        var offsets = [];
                        height = 0;
                        lineElements.forEach(function ($line, index) {
                            context.font = context.font.replace('100px', parseInt(100 * ratio) + 'px');
                            var dimensions = context.measureText($line.text());
                            offsets.push(height);
                            height += dimensions.actualBoundingBoxAscent + dimensions.actualBoundingBoxDescent;
                        });

                        // vertically position the lines
                        lineElements.forEach(function ($line, index) {
                            $line.css('top', (frame[3] / 2) - (height / 2) + offsets[index]);
                        });
                    }, 0);
                }, 1000);

                break;

            case 'paragraph':
                frame = [
                    frame[0] + 20,
                    frame[1] + 10,
                    frame[2] - 40,
                    frame[3] - 20
                ];

                $node = $('<p>');
                $node.css('font-family', getFontNameForStyle(object['style']));
                var fontSize = object['size'] || 17;
                $node.css('font-size', fontSize);
                $node.css('line-height', parseInt(fontSize * 1.5) + 'px')
                $node.css('color', getColorFromArray(object['color']));
                $node.css('box-sizing', 'border-box');
                $node.css('text-align', object['alignment'] || 'left');
                $node.css('white-space', 'pre-wrap');
                $node.text(object['text']);
                
                break;

            case 'video':
                $node = $('<div>');
                var $video = $('<video style="position: absolute" muted loop autoplay>');
                $video[0].onloadeddata = function () {
                    var aspectFrame = getAspectFrame('fill', frame[2], frame[3], $video.width(), $video.height());
                    $video
                        .css('left', aspectFrame[0])
                        .css('top', aspectFrame[1])
                        .css('width', aspectFrame[2])
                        .css('height', aspectFrame[3])
                };
                $video.append('<source src="' + object['src'] + '" type="video/mp4">');
                $node.append($video);
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

            if (opacity) {
                $node.css('opacity', opacity);
            }

            // leaving this comented for a while because it's useful to turn on for visual debugging
            // $node.css('background-color', 'rgba(255, 0, 0, 0.25)');
            $rootNode.append($node);
        }

    });

    return $rootNode;
};

window.ByteRenderer = {
    render: render
};