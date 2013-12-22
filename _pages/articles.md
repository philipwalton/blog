<!--
{
  "layout": "default",
  "title": "Articles",
  "permalink": "/articles"
}
-->

<h2>Archive</h2>

<ul>
  {{#each site.articles}}
    <li><a href="{{ permalink }}">{{title}}</a></li>
  {{/each}}
</ul>