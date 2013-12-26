<!--
{
  "layout": "default",
  "title": "Articles",
  "header": "Article Archive",
  "permalink": "/articles",
  "query": {
    "type": "article"
  }
}
-->

<h2>Archive</h2>

<ul>
  {{#query}}
    <li><a href="{{ permalink }}">{{title}}</a> ({{moment date format="M/D/YYYY"}})</li>
  {{/query}}
</ul>