# byte.js

Byte rendering implemented in Javascript, HTML, CSS, and a bit of Canvas.

![](http://i.imgur.com/cHhpGWj.gif)

[Live Demo](http://bytehq.github.io/byte.js)

### Status

Very early, but this is what we use live on [byte.co](http://byte.co). 

Here's a quick list of what's left to do:

- `Music` object
- Sound on `Video` objects
- `"fireworks"` motion effect
- Unit tests

And some things that could be improved:

- Text rendering is not 1:1 with the iOS and OS X clients. Namely:
  - The `Text` object has different word wrap rules when `word-wrap` is set to `auto`
  - Scaling of `Text` objects behaves differently in some scenarios (usually when clamped vertically)
  - The `Paragraph` object has slightly different vertical align and line height behavior
- `Link` objects have slightly different rendering than native clients, causing minor overlaps in some cases

#### 💘 Contributions and pull requests welcome!

# Acknowledgements

- <a href="https://github.com/jquery/jquery">jQuery</a>
- <a href="http://www.fontsquirrel.com">Font Squirrel</a> for incredibly easy Base64 Webfont CSS
- <a href="https://github.com/typekit/webfontloader">Web Font Loader</a> for font load events
- <a href="https://github.com/ryansturmer/em.js">em.js</a> to measure text dimensions
