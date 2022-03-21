function sletProblem(id) {
  fetch(dbUrl + "/problems" + "/" + id, {
    method: "delete",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: apikey,
      //  "cache-control": "no-cache"
    },
  }).then((e) => e.json());
}
