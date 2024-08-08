async function getToken() {
  const url = "https://paprikaapp.com/api/v2/account/login";
  const data = {
    email: "Your_paprika_email",
    password: "Your_paprika_password",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: Object.entries(data)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&"),
  });

  const result = await response.json();
  console.log(result);
}
