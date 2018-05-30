{% autoescape false %}
DELETE FROM team_affiliation;

-- INSERT INTO team_affiliation(affilid, shortname, name) VALUES(1, 'NULL', '未知学校');
{% for school in school_list %}
INSERT INTO team_affiliation(affilid, shortname, name) VALUES({{ school.id }}, '{{ school.abbreviation }}', '{{ school.name }}');
{% endfor %}

DELETE FROM team;
DELETE FROM user WHERE userid>2;
DELETE FROM userrole WHERE userid>2;
INSERT INTO user (userid, username, name, password, enabled) VALUES (3, 'ball', 'Ballon', 'ball', 1);
INSERT INTO userrole (userid, roleid) VALUES (3, 4);

{% for user in user_list %}
INSERT INTO team (teamid, name, categoryid, affilid, enabled) VALUES ({{ loop.index }}, '{{ user.name }}', 2, {{ user.school.id }}, 1);
INSERT INTO user (userid, username, name, enabled, teamid) VALUES ({{ loop.index+3 }}, 't{{ loop.index }}', '{{ user.leader }} {{ user.member1 }} {{ user.member2 }}', 1, {{ loop.index }});
INSERT INTO userrole (userid, roleid) VALUES ({{ loop.index+3 }}, 3);
{% endfor %}
{% endautoescape %}
