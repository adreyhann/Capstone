# ZeroBounce Email Verification Library for TS

## Getting Started
You will need a [zerobounce account](https://www.zerobounce.net) to get started.  
Once you get an account, you will need to [get an api key](https://www.zerobounce.net/members/apikey/)
to use it in the API calls.

## Installation

Require the package

```bash
$ npm install zerobounce
```

## Usage

```ts
import { Api } from 'zerobounce';

// Example function to show available credits
const credits = async (api: Api) => {
  try {
    const response = await api.getCredits();
    if (response.isSuccess()) {
      console.log('you have', response.success?.credits, 'credits left');
    } else if (response.isError()) {
      console.log('the api returned following error', response.error?.error);
    }
  } catch (error) {
    console.log('unable to fetch data from server', error);
  }
}

// Example function to validate an email address
const validate = async (api: Api, email: string, ipAddress: string | null = null) => {
  try {
    const response = await api.validate(email, ipAddress)
    if (response.isSuccess()) {
      console.log('the email address', email, 'is', response.success?.status);
    } else if (response.isError()) {
      console.log('the api returned following error', response.error?.error);
    }
  } catch (error) {
    console.log('unable to fetch data from server', error);
  }
}

// instantiate the api
const api = new Api('your-api-key');

// output the result of validation call for a valid email address
validate(api, 'valid@example.com');

// output the result of validation call for an invalid email address
validate(api, 'invalid@example.com');

// output the result of validation call for a valid email address but for a different IP Address
validate(api, 'valid@example.com', '127.0.0.1');

// output the result of the get credits call
credits(api);

```

## License
MIT

## Test  
Set your api key in the `ZEROBOUNCE_API_KEY` environment variable, then run:  
```bash
$ npm test
``` 

## Bug Reports
Report [here](https://github.com/twisted1919/zerobounce-ts/issues).
