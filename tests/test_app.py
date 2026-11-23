from app import app, countries, museums


def test_route_index():
    client = app.test_client()
    response = client.get("/")
    assert response.status_code == 200


def test_route_mark_visited():
    client = app.test_client()
    response = client.post("/mark-visited")
    assert response.status_code == 404  # Should return "Not Found" for now


def test_index_lists_all_museums_and_countries():
    client = app.test_client()
    html = client.get("/").get_data(as_text=True)
    assert len(museums) == 50
    assert html.count('class="museum-item"') == len(museums)
    for country in countries:
        assert f'<option value="{country}">' in html


def test_museum_ids_match_list_positions():
    # /mark-visited/<id> indexes the list directly, so ids must be 0..n-1.
    assert [museum["id"] for museum in museums] == list(range(len(museums)))


def test_mark_visited_known_id_returns_no_content():
    client = app.test_client()
    response = client.post("/mark-visited/0")
    assert response.status_code == 204


def test_mark_visited_unknown_id_returns_not_found():
    client = app.test_client()
    response = client.post(f"/mark-visited/{len(museums)}")
    assert response.status_code == 404


def test_debug_mode_is_off_by_default():
    assert app.debug is False
