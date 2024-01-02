import axios, { AxiosError } from 'axios';

let url = import.meta.env.REACT_APP_RUUTER_V2_PRIVATE_API_URL;
if(import.meta.env.REACT_APP_LOCAL === 'true') {
    url = '/generic'
}

const instance = axios.create({
    baseURL: url,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError) => {
        switch (error.response?.status) {
            case 400:
                console.log('Bad request');
                break;
            case 401:   
                console.log('Unauthorized');
                break;
            case 403:   
                console.log('Forbidden');
                break;
            case 404:   
                console.log('Not found');
                break;
            case 408:   
                console.log('Request timeout');
                break;    
            case 500:   
                console.log('Server error');
                break;
            case 502:   
                console.log('Bad gateway');
                break;
            case 504:   
                console.log('Gateway timeout');
                break;                          
            default:
                console.log('Error');    
       }
    return Promise.reject(error);
  }
);

export default instance;
