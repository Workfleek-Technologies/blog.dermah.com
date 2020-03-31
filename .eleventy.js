const markdownIt = require("markdown-it");
const unescapeAll = require("markdown-it/lib/common/utils").unescapeAll;

const Convert = require("ansi-to-html");
const convert = new Convert();

const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function(eleventyConfig) {
  // Define custom markdown-it so we can shove some custom rendering in
  const mdRender = new markdownIt({
    html: true
  });

  // ### RENDER ANSI ESCAPE CODES IN `shell-session` OUTPUT USING SPANS

  // Remember old fence renderer, if overridden, or proxy to default renderer
  var defaultFenceRender =
    mdRender.renderer.rules.fence ||
    function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

  // Shoehorn ANSI colours into the `shell-session` fenced language
  mdRender.renderer.rules.fence = function(tokens, idx, options, env, self) {
    var token = tokens[idx],
      info = token.info ? unescapeAll(token.info).trim() : "",
      langName = "";

    if (info) {
      langName = info.split(/\s+/g)[0];
    }

    if (langName !== "shell-session") {
      // pass token to default renderer.
      return defaultFenceRender(tokens, idx, options, env, self);
    }

    // get default output and mash some ansi spans in there
    let output = defaultFenceRender(tokens, idx, options, env, self);
    return convert.toHtml(output);
  };

  // ### END ANSI RENDER JUNK

  eleventyConfig.setTemplateFormats([
    "html",
    "liquid",
    "ejs",
    "md",
    "hbs",
    "mustache",
    "haml",
    "pug",
    "njk",
    "11ty.js",
    "css"
  ]);

  eleventyConfig.setFrontMatterParsingOptions({
    // Define excerpts before the "---" in files
    excerpt: true,
    excerpt_separator: "<!-- excerpt -->",
    excerpt_alias: "excerpt"
  });

  eleventyConfig.setLibrary("md", mdRender);
  eleventyConfig.addFilter("renderUsingMarkdown", function(rawString) {
    if (!rawString) {
      throw new Error(
        "Post did not have an `excerpt`. Define it in front matter or use the `<!-- excerpt -->` comment to define the exceprt in the post."
      );
    }
    return mdRender.render(rawString);
  });

  eleventyConfig.addPlugin(syntaxHighlight);

  return {
    dir: {
      input: "src",
      output: "dist"
    }
  };
};
