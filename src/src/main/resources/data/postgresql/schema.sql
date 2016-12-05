CREATE OR REPLACE FUNCTION getnexttrackid(IN i_deviceid UUID)
  RETURNS SETOF UUID AS
'
DECLARE
  i_userid uuid = i_deviceid;
 BEGIN
  -- Добавляем устройство, если его еще не существует
  -- Если ID устройства еще нет в БД
  IF NOT EXISTS(SELECT recid
                FROM devices
                WHERE recid = i_deviceid)
  THEN

    -- Добавляем нового пользователя
    INSERT INTO users (recid, recname, reccreated) SELECT
                                                     i_userid,
                                                     ''New user recname'',
                                                     now();

    -- Добавляем новое устройство
    INSERT INTO devices (recid, userid, recname, reccreated) SELECT
                                                               i_deviceid,
                                                               i_userid,
                                                               ''New device recname'',
                                                               now();
  ELSE
    SELECT (SELECT userid
            FROM devices
            WHERE recid = i_deviceid
            LIMIT 1)
    INTO i_userid;
  END IF;

  RETURN QUERY
  SELECT tracks.recid
  FROM tracks
    LEFT JOIN
    ratings
      ON tracks.recid = ratings.trackid AND ratings.userid = i_userid
  WHERE ratings.ratingsum >=0 OR ratings.ratingsum is null
  ORDER BY RANDOM()
  LIMIT 1;
END;
'
LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION getnexttrackid_string(i_deviceid UUID)
  RETURNS SETOF CHARACTER VARYING AS
'
BEGIN
  RETURN QUERY SELECT CAST(getnexttrackid(i_deviceid) AS CHARACTER VARYING);
END;
'
LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION registertrack(
  i_trackid               UUID,
  i_localdevicepathupload CHARACTER VARYING,
  i_path                  CHARACTER VARYING,
  i_deviceid              UUID)
  RETURNS BOOLEAN AS
'
DECLARE
  i_userid    UUID = i_deviceid;
  i_historyid UUID;
  i_ratingid  UUID;
BEGIN
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  SELECT uuid_generate_v4()
  INTO i_historyid;
  SELECT uuid_generate_v4()
  INTO i_ratingid;

  --
  -- Функция добавляет запись о треке в таблицу треков и делает сопутствующие записи в
  -- таблицу статистики прослушивания и рейтингов. Если пользователя, загружающего трек
  -- нет в базе, то он добавляется в таблицу пользователей.
  --

  -- Добавляем устройство, если его еще не существует
  -- Если ID устройства еще нет в БД
  IF NOT EXISTS(SELECT recid
                FROM devices
                WHERE recid = i_deviceid)
  THEN

    -- Добавляем нового пользователя
    INSERT INTO users (recid, recname, reccreated) SELECT
                                               i_userid,
                                               ''New user recname'',
                                               now();

    -- Добавляем новое устройство
    INSERT INTO devices (recid, userid, recname, reccreated) SELECT
                                                          i_deviceid,
                                                          i_userid,
                                                          ''New device recname'',
                                                          now();
  ELSE
    SELECT (SELECT userid
     FROM devices
     WHERE recid = i_deviceid
     LIMIT 1)
     INTO i_userid;
  END IF;

  -- Добавляем трек в базу данных
  INSERT INTO tracks (recid, localdevicepathupload, path, deviceid, reccreated)
  VALUES (i_trackid, i_localdevicepathupload, i_path, i_deviceid, now());

  -- Добавляем запись о прослушивании трека в таблицу истории прослушивания
  INSERT INTO histories (recid, deviceid, trackid, isListen, lastListen, methodid, reccreated)
  VALUES (i_historyid, i_deviceid, i_trackid, 1, now(), 2, now());

  -- Добавляем запись в таблицу рейтингов
  INSERT INTO ratings (recid, userid, trackid, lastListen, ratingsum, reccreated)
  VALUES (i_ratingid, i_userid, i_trackid, now(), 1, now());

  RETURN TRUE;
END;
'
LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION getnexttrackid_v2(i_deviceid uuid)
  RETURNS TABLE(track uuid, methodid integer)
AS
'
DECLARE
	i_userid uuid = i_deviceid;
	rnd integer = (select trunc(random() * 10)); -- получаем случайное число от 0 до 9
    o_methodid integer; -- id метода выбора трека
BEGIN

  -- Выбираем следующий трек

  -- В 9/10 случаях выбираем трек из треков пользователя (добавленных им или прослушанных до конца)
  -- с положительным рейтингом, за исключением прослушанных за последние сутки
	IF (rnd > 1)
	THEN
		o_methodid = 2;
		RETURN QUERY
		SELECT trackid, o_methodid
          FROM ratings
          WHERE userid = i_userid
            AND lastlisten < localtimestamp - interval ''1 day''
            AND ratingsum >= 0
          ORDER BY RANDOM()
          LIMIT 1;

		-- Если такой трек найден - выход из функции, возврат найденного значения
		IF FOUND
	      THEN RETURN;
		END IF;
	END IF;

	-- В 1/10 случае выбираем случайный трек из ни разу не прослушанных пользователем треков
	o_methodid = 3;
	RETURN QUERY
	SELECT recid, o_methodid
      FROM tracks
      WHERE recid NOT IN
		(SELECT trackid
		FROM ratings
		WHERE userid = i_userid)
      ORDER BY RANDOM()
      LIMIT 1;

  -- Если такой трек найден - выход из функции, возврат найденного значения
	IF FOUND
	THEN RETURN;
	END IF;

	-- Если предыдущие запросы вернули null, выбираем случайный трек
	o_methodid = 1;
	RETURN QUERY
	SELECT recid, o_methodid
	  FROM tracks
      ORDER BY RANDOM()
      LIMIT 1;
	RETURN;
END;
'
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION getnexttrackid_v3(IN i_deviceid uuid)
  RETURNS TABLE(track uuid, methodid integer) AS
'
DECLARE
	i_userid   uuid = i_deviceid;
	rnd        integer = (select trunc(random() * 1001));
	o_methodid integer; -- id метода выбора трека
    owntracks integer; -- количество "своих" треков пользователя (обрезаем на 900 шт)
BEGIN
	-- Выбираем следующий трек

	-- Определяем количество "своих" треков пользователя, ограничивая его 900
	owntracks = (SELECT COUNT(*) FROM (
		SELECT * FROM ratings
			WHERE userid = i_userid
					AND ratingsum >=0
			LIMIT 900) AS count) ;

	-- Если rnd меньше количества "своих" треков, выбираем трек из треков пользователя (добавленных им или прослушанных до конца)
	-- с положительным рейтингом, за исключением прослушанных за последние сутки

	IF (rnd < owntracks)
	THEN
		o_methodid = 2; -- метод выбора из своих треков
		RETURN QUERY
		SELECT trackid, o_methodid
          FROM ratings
          WHERE userid = i_userid
                AND lastlisten < localtimestamp - interval ''1 day''
                AND ratingsum >= 0
		ORDER BY RANDOM()
		LIMIT 1;

		-- Если такой трек найден - выход из функции, возврат найденного значения
		IF FOUND
		THEN RETURN;
		END IF;
	END IF;

	-- В 1/10 случае выбираем случайный трек из ни разу не прослушанных пользователем треков
	o_methodid = 3; -- метод выбора из непрослушанных треков
	RETURN QUERY
	SELECT recid, o_methodid
      FROM tracks
      WHERE recid NOT IN
            (SELECT trackid
             FROM ratings
             WHERE userid = i_userid)
    ORDER BY RANDOM()
	LIMIT 1;

	-- Если такой трек найден - выход из функции, возврат найденного значения
	IF FOUND
	  THEN RETURN;
	END IF;

	-- Если предыдущие запросы вернули null, выбираем случайный трек
	o_methodid = 1; -- метод выбора случайного трека
	RETURN QUERY
	SELECT recid, o_methodid
      FROM tracks
      ORDER BY RANDOM()
    LIMIT 1;
    RETURN;
END;
'
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION getnexttrack(i_deviceid UUID)
  RETURNS TABLE(
    track character varying
  , methodid integer)
  AS
'
DECLARE
  i_userid   uuid = i_deviceid; -- в дальнейшем заменить получением userid по deviceid
BEGIN
	-- Добавляем устройство, если его еще не существует
	-- Если ID устройства еще нет в БД
	IF NOT EXISTS(SELECT recid
				  FROM devices
				  WHERE recid = i_deviceid)
	THEN

		-- Добавляем нового пользователя
		INSERT INTO users (recid, recname, reccreated) SELECT
				i_userid,
				''New user recname'',
				now();

		-- Добавляем новое устройство
		INSERT INTO devices (recid, userid, recname, reccreated) SELECT
				i_deviceid,
				i_userid,
				''New device recname'',
				now();
	ELSE
		SELECT (SELECT userid
				FROM devices
				WHERE recid = i_deviceid
				LIMIT 1)
		INTO i_userid;
	END IF;

	-- Возвращаем trackid, конвертируя его в character varying и methodid
	RETURN QUERY SELECT
					 CAST((nexttrack.track) AS CHARACTER VARYING),
					 nexttrack.methodid
				 FROM getnexttrackid_v3(i_deviceid) AS nexttrack;
END;
'
LANGUAGE plpgsql;