let body = {
  problem_added: date,
};
fetch(dbUrl + "/problems" + "/" + id, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    Authorization: apikey,
    // "cache-control": "no-cache"
  },
  body: JSON.stringify(body),
  json: true,
})
  .then((e) => e.json())
  .then((e) => {
      dataGet();
    }
  });
