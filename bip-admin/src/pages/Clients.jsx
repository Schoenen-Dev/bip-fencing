import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../utils/api";

const BIP_LOGO_B64 =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAB4AHgDASIAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAABgcABAUIAQMC/8QAQRAAAgEDAwIDBwEDCgQHAAAAAQIDBAURAAYhEjETQVEHFCIyYXGBkRUjQggkM1JicqGisdEWgsHwJVRjg5KU4f/EABkBAAMBAQEAAAAAAAAAAAAAAAABAwQCBf/EADERAAEEAAQBCwMFAQAAAAAAAAEAAgMRBBIhMQUGE0FRYXGRobHR8BQiMjNCgeHxwf/aAAwDAQACEQMRAD8A6m1NTU0IXuql0uNFaqGWsudVBSUkQy807hEX7k6H95bwgsSPTUqx1NzCByjv0RU6E4EkzgHpUngKAXc8KDzhFbu3rR0V5iqty1dZXVsUqiTwY1ElGrEZKRnKU3HYfHMfNk7aRIG6m+QN0GpTXvHtN+JYrFbXk8Qfuqi4FqdZB6xwhWnkH1CBT/W1hVV23hcSfHuVRRo38EEcVCv+YTTf4KftooorVQ0cLNbvCSOYCTxUyzTgjIZnOWbIOeSe+sG73i02ySSOsrEikQoGQKWI689JwB24PPlrQ2NgGaR1BZXvmPZ3fP8AgXkOy7lcoY5a689SOvUPGqq2f9czIv8Al19X9mKx4b32kx/X9zkAH58fP+OrNjv9LeLPG9rqJJKeB5I2x8IYqVOOORkP9CcarXy7wWW3y3K6VZWihiE0ksmW+PjCEc57HC6Qja7Vp0TodJN9591+ZNoXSgYR0F7jEh5EcVbWQMfx4si/5dVW3Duex3T9ny3QVNUqBzTVKRVvwnscw+FMPv0P9tatJdY6ujZaSWJxOqugHHVI5JVgPsUP040ob+brN7QrzdjdqC2UdTVtClZLKMr4ahVRQRntzxqcrebrtXTQTeQnT+fXVOu0e0qmeNjfKQ0kUZxJWUrmppoz/wCoQokh/wDcRR9dHlLUwVdNHUUk0c8Eq9SSxMGVx6gjgjSXuFUh2tQ3OtqKOW5UsbN7xSS4lmHYeHN1AjzyPiz2we2sHY27EkFXcdq1Rp1hbqq4pYOiEgnHVUQJwnVg/wA4hA5HxocHXJ0NFUEpb+fiPmi6LOvdYe19x01+p3Co1NXwBfeKSRgXj6hlWBHDo3dXXKsPqCBt6Fde6mvNTQhTWBvC9/si3N4DKtS4+FihcRgnHV0jljkgKg5ZiBwMkb+ufvbNu6d6mSKzB2lKt4LoceGgyjT5/rN8SR+i9bjlgdImhanI4jQblC+9dxrHZbyLdVyxXKmqY45KhSJTBLKHDN1DHXPhMNKOE+SMADOkjXU9wZlZJBU9Ckl4zyvPOR82fuO+imBDT7NvI4CvVUhT1H9IMEfwn7+XPnrBiimkcPFG5RGC9QHAJ7c+WdTcAaK5a3KE+fZB7Qlb2bQ0tZHNPX2uQ0R55EZBaEt59gy/8msE2aOvqZqm4zSzTVMheRy3QTxnp4xxz29dY3szqEgvE9HdfghrljpJHbujM/7t8+eHC/gnRvWUNTa6pIKpkz1N8aHgnAGD6H6anK4Ehr1qhiDwXAbLQ2xtyG97Wu9soKmS11sdQlbS1FOegLMvUgL9PzDGAfT7jQrDJWb33PDBuC2+52uxS5uUUbGVamsBIy3JJQdOTwcA4OQeDv2Y1Bhvkig48aKVOAO4bqAH/wATrK9mMqvuv2giT4gbw2R+X51qi/FQnBBNJixywwW6Sti8LphhaZPAUENwSOnHkTj/AL50udsUtLV2q4QVtMssPvz/AAyRggEKOfp99Ft8p46O1VbURKmqkSN05KMc9RbpHn8IHHrznQ9spJFpboV6SRXP1ZBH8I7aJn5ilhm0Esd/7SrqOnSooJPeLMnWGjYktHhjk4A5B6Ryv/7o59k1JNYNlWypMLvUXipFQDGyoYoieiL5iCVC9TY5J6+2iREVvCEzCGHrmaSXPCoBIWJ9MAH9NfWqrqHcFPZKqzwGSj94QxhKJZehFIAOGwUUAfOORjjOlhGNbJmRPoK61bmpWtcsVztjiBabqciNeoUwPLsqj5oG7yRDt86YIxpn2W4rc6BJwojk7SRhg3S2AeGHDAgghhwQQfPQMsjwV9JHGQPE62J8x0jII5/3/GtXazparktEoAoKwE0nT8sTjLND/dxl09B1r2A1eeMNOZuyzwvLDlO3ojLU17qagtixd3VfulknPimHxAUMgOCi4JdgfUKGx9ca59u8loqp5qm4FwZGGIYpo/gQYCoMngBQB+NMX+UVdxa9mwxBY3etnEHS+cdOOtjwf7Kj865qtoqLvXpR2u2VFRVSdoqRiTjzPOcD6kgDWScvJpqi51OK3d1yW5tt3H9mpMf3lOJfEdct8T9ipPYcfnWLDUWiKkRF8bx2TrlYy/CZDkkBRn6AfbTIsXsZvV0tNZT1lbQ2wzSxOVMvvDp09XB6cDPPqfromt3sehojio3RUV0o+EqaZI4/scHqP666LZC0Umc1bJVUz2GSNwGqkj+HxWfvnyxx66bK1lHuS0U9T1Rzxzr0GTABEqAByc+Z4b7PpZWa+5u1xorjSW+Kmp3aB46VQ7IysRyzAnOR+mmmyUlumipaSkSKnl8MkKv8RlZC336QB+AdRmhfI2j88lbAYjK8urQaH1WFtueSz7uoYpgHg95Cdaj5QxKnkf3u2qvsucDdXtBDZIF5dWx/efRLWwUlVTRSTS+HMFEilhkDpRXye3PPfSXtN6tdbuHcMqivo2q6t6iRkqmTLuWbyGMcnH0++dXwzpIwQ8Wq4wMfRjTs3nUxZoqYsw6IzK3DZ+M4Hb6KP11Q2R0Nbrj3bFc+ME+g0Jvf6OeRGSd4giRoBJ8eFVQoGcgkgD9dW7XuWmt1inagzWV9RUvMaUgnw0wMyMw7xgc54yTjvqhLnE2FEERtvqVr2nV01B7P69qKkqKiaslajHhAsyIWZpGwP7IC5/t6Adi36mstH41wj8ZoaiGoMcyl+cnoKlMFWGMDqyo740xLlfrZPQFKn3aakp6iWNJFYFiT8UkgHfjhQB8xA7Z1kV1JbmtT00scvvIp4ppYZR1ADqUDxDyvUecAeh9M6mQ4EOHQkHsl0aURWX2mWy7XqGSpAoaOmpmeV5W5EjKxI/tD4eMcnPbjRxQ1tNU2mOF6uGFTHHJTVDMAsciqpQ57fN+oJHnpEXXZVAqypRO0BmfJAGVBXqxx6c9vtrCu9uu0FvqViqJJ0kjYLEhJPOWAA8zz+NVGIflpyToOhdq2qsFfbqepC9BkXLJ/Ubsy/ggj8amgr2IXmW97BoamqDLUdPTMpPIkX4H/AFZC3/Nqa6BsWht1qhb+UfRT3CGxQ09WKfpMzsDn4s9Az+PT66X9t2VK9pWE7iq7arnwpAhSMzkMSSW+Y8dJC54BGnb7T7KbrJZZMMUhmZXVVz1A4OPp8p0ltt3va24t8PaIdnmWTxJmknralpwnTnJ6T9QB5agwP515O2lIDfutL7cCfsSSgoLVPUNJOhleXxWLyjxCEPfviPI9Oo6Ymwn3HULBLcY65qMU9TJJNMnQAwDdHxYBzkDGjmrtklBuKuulqo6dEEXu/iOcIsaEkBRkKgA8xjP41VTftnntdelbcKCKqAliUCVW8UBSA4GTjOe2cjVgbKqWUAbCSm5yIt77rjjVQzXUY7D52Ddz9zpwUrm5JFPDPTuIHjRsTKMYlZz3PPDDSJ3NVpcd6bkqqKRZaeS5Kyup4ZQMdQz37aY+1NwwUszQvchBCepyvjMFySeTjucY1PMLIWPDuZG6QEje/IIp3BDcv2YDS0skrxwSL+6IfkwKoAwe5II0jLbFSRVlbR3qiraSeEBVLSsrk9yMdlx6Y8xp1124qIxR+FdaVsyKD+8Vvh8+GOhq8WTbFXe1rGlpppK6b+c/vo2HC8ED+HsMn/fXQIVzNGf3DxQBLSWtv6K5VkYIz8XS2Pp2Bzop2KaKGql8GpMxShMSkkqxbqJJ4Pby/GtKv2TtVpaYU7QYeToYxzoSBgnPH2768GybVSVEUdtrpIPHDBmSUNwAOO/bXVhGYEaFfmGGjlm209SqyqsDKyyIrqcJnkH0Pb08tY0G6jC8FuanR4JqiQz1DEmWQdRCksc9lVVHoB+pKNrTLVUkEV1dhBEzIGiBBHy479udYs2xq1KepmSvpnkhkdGZoWXIJzgYzj5v++NLdSgYWfOwLTbcdO07pIiSzRSFR8y9XUMqTg+eca3tvz2ivRobbI4qZYx0yysGHSeMAgAgcYz+ugiTYd896m6ZKKRgyyMcsOo84/h7DWjtbblyoq+iaoEKQyAIHWUsAMEk4xnjqJx9tcuja8UQtbXuabC6F9ltGlFa65Iw4HvLMQ5zgkLnHoMg6mr3s/jQ2mepicvFUTl0YgjIAA8/sdTTiBDAClIQXkhbd5kMVprJU+eOF3U+hCnXIthuFHNuKsWrrKNgiu8cc8M0CswcYHVLIY24yex9fLXY2hneezqLd9nqbXdqidqKoGHQRxE8HIIJQkEHsQdUXC409plYU3lcJbZNIaILGoennApC/hKDhF+HPUTnHGQdUqvZsC7ejrhVSPWyUpriRE/SsYfo5lzjrzz04xjXR1u/k27UtyViU9wuhWqiMMhlWCQhT/VLRnpP9oYP10Nbu2/bNqOm3LfJ7/TQoGmNZDGxJOCFbCgMR3zjzHpqckgjbZWvBYOTGy81Fv27Lnuz2Ca4RtXy2asqaaSBnEyRTFOoYyQyjHGD54/TXxp4rH40YZISpOCBM4z/AJtdLbWq9x/staKwTiloICVSngVI0XJLHC8ADJz9zrNj2LJbqlK+OzWenmgcSrOtPCpjYHIbI7YPOdTE4IsNK2ycHdG8xvlYD3n2XPVBRwVddUx0Ecsv70qkcZZjjyAz5fXWlFsi+3GO8z2qGoqUtEypWCFyTGpUnOM8n4cYGTny02IqWkNc9RHa7e1VM5ZmWlUM7Hucrg5PPIOdNJ7fQbN9nlPX2GaroJ6xUCwCpeVQ3J+AseAMscjOR+DoZiGPBI6FzieBz4eRkbqJeaFf4ufrB7It4VVskqJtu3J5JHzCGq/BHhkAgj5ue/fGsLde2K3adRFT7jpqu1zTKXjWW4v8YHcgiMg6ftiv25bxdqeigulR1ytgtnsPM6+ntgNJVXyK11CU9ygokHFXCsvQ5Azgtk5xjJ+3ppfUMLc9aJu5PzDEDDfaXEX06Dt0XL9XUQJTJJT1lQWLhMpWO+eeRzGBnGPPWjPFcaeot6Grq197RmhQScsAcA4z5ntnT2tmz6q62KOGjsFBNbPFaVYVoUKB8YLYxjJAxn0Gqt62aLPBFNctv2mEFuiMSUMYY/YY7caOebWbKaXI4EHS8yJI821Wd/BJdFvXiXeKC4VrT0JIl6JiexAAGDySTjA89Nnbfsy3pPcIpZYNxpb1gSaNaqrgBaQEfAwWUfuypOcYb6jRx7IbbYqu/PT1O2rKZVTxo6qOjRJEYfUD7/XjTzp6Glp+IKeOP+6MapGWvbmAWHGcPODlMMgFjqXwsNvhtVnpKKmiMMcSACMuX6SeSMkknknzOpq/qaqoKa915qnX3BKJkV4KuXqBOYKd5APv0jjQkSBqV5e7jDabVVV9SQIoIy5z5+g/J1y/cK2S4V1RWVLhpp3Mjc+Z8v8AproO+Nbb1GkdfRXto056Ep50U/cAYOgbfFtttjutno7fbwwropZGef3mRk6OnA6Ist/F6cazTwmWqOi9jhfGsPwxr3vaXE14f6hKnptqtTxmpulQs3SOoCjdxn79Y/01XukG2oqRzbq2oqKk8IppTEAfUkuePpjRlfLXR2nZNNd2t8M1XPUxxKitUogV2wD0NiTP0x9tX9sbbpbhTV9RcKBUjp0ygRKynYtgnnxcZHHlrg4ckVp4LSzlHAJQbkJ3rMK9NkvdpRTyXujSOLxIZpVR42QMsq5yVwe/b8dzwDrd9rd9S57j9yp3X3S3jwlCngv/ABH8cD8avWHdlDS2Ck/8Ehtt4uEkCKRJJmemlcKXilyXBXzXPB51q3Xb9NU7tqLFYaGAT01OtVUVFfUzEHrJACKpye3JJ40fTkR5AVNnKbDyYsYt0ewoAb69em9Wsz2Zww2e03LctaB4dPGRFn+JvID/AL8xoEj8e83jLt11NVKWYjk5JydNzdFCtn2LbvfaKEypVRQvBBWStCfEkCls8FiB2z27aoXlrXtDfNJFHaJpqCCkFbUVKTOz048Qp1lM4ZAcEjGR38tDsNYa29Auo+UsUD5Z3NOd9V2DoHuqw9lVy6RiuhUeSmZ+PpwuNer7Jq5nHi11Nj1LO5/0H+uiSLfzf8HXS+e7Qz+BcHoqZYnISUdYRGZj2B6gSdaW3NwV8u4KuzXx7b79FD4ypRpODjjPzrhgMj4gec9tW5iPqXmjlBinEASnXu9l+9m7Mo9tdcqSGoqmHT4hXpVR59K5PfA5JJ48hxop1k/t6H/yV0/+jL/tq3QVyVvX0Q1UXRj+ngaLOfTqHOqgACgsj5jK4uc6yVb1NTU00lNTVW7FltVYUZkcQOQynBB6TyD66C5Lrcj7j/PZsluSAvPwHvxz+dCEfcaVu/8AdFRQ7upv2TZjUVVvgk/ns1LM6hn6cxx9JAJx3PPp66LdvVlVPLXtUzvIVeBVDYwoOc4AHnnQbX3642zct7MFZL0CrYCNz1qAI04APbue2kVKWN0jcrTSyLvuu7X6jSjutso5qZnRysluqx0MCcE9LZyMA8euqNkv1ztdTVCistLAssMas7UtY4fqPxLhnOMDJJ0f7e31NV1VHR19KDJMEXxomwMscZKny+2iO6VM5qaSlSd4RPOyGRSAQBz5/wC3poWU4J5OYv17v7ShN5q5rdb6KWyWz3a3ur0kZttWTERk5U9WRjA4J5yNeXu+V98mgmutmoJqmMFVljoayN1XpBI61ZSR1Fhjtxnz0zqWvrpBABVuplERHUqnl2cD746M/XPca0rbcKieAeMysXhjnRgMEBj2YdtFJHBOIov8v7SZXcd3ahjsx23b47TAI54VFDU9IkDK3YNnIJY+ecfXV6fed9/ayXH9i0klY6e5yTC3VJIg5cjHVyM48u5Oiv2hXi40u9tuW+lq5IaSZJpZEQ462UHGT349O2jSw1E1TZoZp3LSkMC3rgkf9NJMYJ4H6nkkvRbguFNaZ7TT7etyW+fqklpzbakxsWCk8Fu/Pby6Tjtr52zcFbtuqNZbNuQzuOmJitLVmVoixyqNI7dAAVTjGORph7umrIt0bdENdUrT1EbzzUyyFUkaEKy8jkAmTkDhulc6uw7kuE+6LfbI6anWnqY3maVnJZVj+cADuSWTB4x8Wc8adKQwrr/PbTb51oitFfDdbbT1tMkqxzL1BZYyjr6hlPII7auDQduueUX/AG8FlkUe9yqQjMAwAXAOGGfPvkapXffNZad92ewm2CqpK6NGkqll6WgLymNSVx8Qzj0xpr0xdao+1NTy1NCar3GnaroZ6dGVTKhTLKSMHg5AI8vroZO0HYoWqKTK5x0wyAZxgYHieQ/XU1NCFqWOyNbvePElhcylDmKNk+X1yzZ/w1k12zFqayrqBNTh6mYysXjduCAMfOOcAfT6ampoQpbtmJSVtNUFqNjC4YdMUitgEEYPiHnjzB1r7gsz3SlEEc0Ma+IZG8WNm58sdLKR+upqaELJOz3wvTVxAspWQ9M3xZOTj97wDgcfTWtY7M1uhqFmmjkeVs9UasvHoepmzqamhCy7ptKa63Gnr66tgkq6YFYZFp2XpB78deO2tS3W2volihSvp2pVz1RmnPUcnJw3Xx+mpqaEL83mwLcamkqFlSOeljaOJ3Rm6Q2OrgMBz0j9NVqPbk0F4p65qmnYw9ariFw3Q2MrnrI/hHOPLU1NCVBXLvZVr6iknQwCamkaRHmiMnSWxnp5GO311h3LY6XG92+71b0MlyoQPAnNNIChDFhgCQDzPBB51NTQmjTU1NTQhf/Z";

// Decode JWT to get role
const getRole = () => localStorage.getItem("role");

const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase() || "?";

const COLORS = ["primary", "success", "warning", "info", "danger", "secondary"];
const colorFor = (id) => COLORS[id % COLORS.length];

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getStatusBadge = (pending, totalBilled) => {
  if (Number(pending) <= 0) return { class: "bg-success", label: "Fully Paid" };
  if (Number(pending) >= Number(totalBilled))
    return { class: "bg-danger", label: "Unpaid" };
  return { class: "bg-warning", label: "Partial" };
};

// ── Number to words ───────────────────────────────────────────
function numberToWords(num) {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  if (num === 0) return "Zero";
  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 ? " " + inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + inWords(n % 10000000) : "")
    );
  }
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = "INR " + inWords(rupees) + " Rupees";
  if (paise > 0) result += " and " + inWords(paise) + " Paise";
  return result + " Only";
}

// ── Tax Invoice Print View ────────────────────────────────────
function TaxInvoiceView({ inv, onBack }) {
  const items = inv.items || [];
  const printStyles = `
      @media print {
        .no-print { display: none !important; }
        body { margin: 0; }
        .invoice-wrapper { padding: 0 !important; background: white !important; }
      }
    `;

  return (
    <div
      className="invoice-wrapper"
      style={{ background: "#f0f0f0", minHeight: "100vh", padding: "20px" }}
    >
      <style>{printStyles}</style>
      <div className="no-print d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Tax Invoice — {inv.invoice_no}</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>
            ← Back to Clients
          </button>
        </div>
      </div>

      <div
        id="invoice-print"
        style={{
          background: "white",
          maxWidth: "900px",
          margin: "0 auto",
          border: "2px solid #000",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
        }}
      >
        <div
          style={{
            textAlign: "right",
            fontSize: "10px",
            padding: "2px 8px",
            borderBottom: "1px solid #000",
          }}
        >
          (ORIGINAL FOR RECIPIENT)
        </div>

        {/* Company Header */}
        <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
          <div
            style={{
              width: "80px",
              minWidth: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
              margin: "6px",
            }}
          >
            <img
              src={BIP_LOGO_B64}
              alt="BIP Fencing"
              style={{ width: "68px", height: "68px", objectFit: "contain" }}
            />
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "8px 0" }}>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              BIP FENCING CONTRACT WORK
            </div>
            <div style={{ fontSize: "11px" }}>
              NO: 26/A, MAIN ROAD, PAMBANKULAM, KALANTHAPANAI, PANAGUDI - 627109
            </div>
            <div style={{ fontSize: "11px" }}>
              GSTIN/UIN: <strong>{inv.seller_gst || "33ABLPI5244C1Z1"}</strong>{" "}
              &nbsp;|&nbsp; State: Tamil Nadu, Code: 33
            </div>
            <div style={{ fontSize: "11px" }}>
              Ph: {inv.seller_phone || "9655072445"}
            </div>
          </div>
          <div
            style={{
              width: "160px",
              padding: "6px 8px",
              fontSize: "10px",
              borderLeft: "1px solid #000",
            }}
          >
            <div>E-Way Bill No: {inv.eway_number || ""}</div>
          </div>
        </div>

        {/* Consignee + Invoice Details */}
        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          <div
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRight: "1px solid #000",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "10px",
                marginBottom: "2px",
              }}
            >
              CONSIGNEE (SHIP TO)
            </div>
            <div style={{ fontWeight: "bold" }}>
              {inv.consignee_name || inv.buyer_name}
            </div>
            {inv.consignee_address && <div>{inv.consignee_address}</div>}
            {inv.consignee_state && (
              <div>
                State Name: {inv.consignee_state}, Code:{" "}
                {inv.consignee_state_code}
              </div>
            )}
          </div>
          <div style={{ width: "320px", fontSize: "11px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Invoice No.", inv.invoice_no],
                  ["Delivery Note", inv.delivery_note || ""],
                  ["Reference No. & Date", inv.reference_no || ""],
                  ["Other References", inv.other_references || ""],
                  ["Buyer's Order No.", inv.buyers_order_no || ""],
                  ["Dated", inv.invoice_date],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: "1px solid #ccc" }}>
                    <td
                      style={{
                        padding: "2px 6px",
                        color: "#555",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </td>
                    <td style={{ padding: "2px 6px" }}>: {value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            style={{
              width: "220px",
              fontSize: "11px",
              borderLeft: "1px solid #000",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Dispatch Doc No.", inv.dispatch_doc_no || ""],
                  ["Delivery Note Date", inv.delivery_note_date || ""],
                  ["Dispatched through", inv.dispatched_through || ""],
                  ["Destination", inv.destination || ""],
                  ["Bill of Lading/LR-RR No.", inv.bill_of_lading || ""],
                  ["Motor Vehicle No.", inv.motor_vehicle_no || ""],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: "1px solid #ccc" }}>
                    <td
                      style={{
                        padding: "2px 6px",
                        color: "#555",
                        whiteSpace: "nowrap",
                        fontSize: "10px",
                      }}
                    >
                      {label}
                    </td>
                    <td style={{ padding: "2px 4px", fontSize: "10px" }}>
                      : {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buyer */}
        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          <div
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRight: "1px solid #000",
              fontSize: "11px",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "10px",
                marginBottom: "2px",
              }}
            >
              BUYER (BILL TO)
            </div>
            <div style={{ fontWeight: "bold", fontSize: "13px" }}>
              {inv.buyer_name}
            </div>
            {inv.buyer_address && <div>{inv.buyer_address}</div>}
            {inv.buyer_phone && <div>Ph: {inv.buyer_phone}</div>}
            {inv.buyer_gst && <div>GSTIN/UIN: {inv.buyer_gst}</div>}
            {inv.buyer_state && (
              <div>
                State Name: {inv.buyer_state}, Code: {inv.buyer_state_code}
              </div>
            )}
          </div>
          <div style={{ width: "320px", fontSize: "11px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Invoice No.", inv.invoice_no],
                  ["Invoice Date", inv.invoice_date],
                  ["Payment", inv.payment_mode || ""],
                  ["Transport", inv.dispatched_through || ""],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: "1px solid #ccc" }}>
                    <td
                      style={{
                        padding: "2px 6px",
                        color: "#555",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </td>
                    <td style={{ padding: "2px 6px" }}>: {value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            style={{
              width: "220px",
              borderLeft: "1px solid #000",
              fontSize: "11px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Motor Vehicle No.", inv.motor_vehicle_no || ""],
                  ["E-Way Bill No.", inv.eway_number || ""],
                  ["Delivery To", inv.destination || ""],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: "1px solid #ccc" }}>
                    <td
                      style={{
                        padding: "2px 6px",
                        color: "#555",
                        whiteSpace: "nowrap",
                        fontSize: "10px",
                      }}
                    >
                      {label}
                    </td>
                    <td style={{ padding: "2px 4px", fontSize: "10px" }}>
                      : {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Items Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            borderBottom: "1px solid #000",
          }}
        >
          <thead>
            <tr
              style={{ background: "#f5f5f5", borderBottom: "1px solid #000" }}
            >
              <th style={thStyle}>Sl No.</th>
              <th style={{ ...thStyle, textAlign: "left" }}>
                Description of Goods
              </th>
              <th style={thStyle}>
                HSN/
                <br />
                SAC
              </th>
              <th style={thStyle}>Quantity</th>
              <th style={thStyle}>
                Rate
                <br />
                (Incl. of Tax)
              </th>
              <th style={thStyle}>
                Rate
                <br />
                (Excl. Tax)
              </th>
              <th style={thStyle}>per</th>
              <th style={thStyle}>
                Amount
                <br />
                (Taxable Value)
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={item.id || idx}
                style={{ borderBottom: "1px solid #eee" }}
              >
                <td style={tdCenter}>{idx + 1}</td>
                <td style={{ ...tdStyle, textAlign: "left" }}>
                  {item.description}
                </td>
                <td style={tdCenter}>{item.hsn}</td>
                <td style={tdCenter}>
                  {item.qty} {item.per}
                </td>
                <td style={tdRight}>{fmt(item.rate_incl)}</td>
                <td style={tdRight}>
                  {fmt(item.rate_excl || item.taxable_amt / (item.qty || 1))}
                </td>
                <td style={tdCenter}>{item.per}</td>
                <td style={tdRight}>{fmt(item.taxable_amt)}</td>
              </tr>
            ))}
            {items.length < 6 &&
              Array(6 - items.length)
                .fill(0)
                .map((_, i) => (
                  <tr
                    key={`empty-${i}`}
                    style={{
                      height: "22px",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <td colSpan={8}>&nbsp;</td>
                  </tr>
                ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "1px solid #ccc" }}>
              <td
                colSpan={6}
                style={{
                  textAlign: "right",
                  padding: "3px 8px",
                  fontSize: "11px",
                }}
              >
                CGST TAX
              </td>
              <td
                colSpan={2}
                style={{
                  textAlign: "right",
                  padding: "3px 8px",
                  fontWeight: "bold",
                }}
              >
                {fmt(inv.cgst_amount)}
              </td>
            </tr>
            <tr>
              <td
                colSpan={6}
                style={{
                  textAlign: "right",
                  padding: "3px 8px",
                  fontSize: "11px",
                }}
              >
                SGST TAX
              </td>
              <td
                colSpan={2}
                style={{
                  textAlign: "right",
                  padding: "3px 8px",
                  fontWeight: "bold",
                }}
              >
                {fmt(inv.sgst_amount)}
              </td>
            </tr>
            {Number(inv.round_off) !== 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "right",
                    padding: "3px 8px",
                    fontSize: "11px",
                  }}
                >
                  ROUNDING OFF
                </td>
                <td
                  colSpan={2}
                  style={{ textAlign: "right", padding: "3px 8px" }}
                >
                  {Number(inv.round_off) > 0 ? "+" : ""}
                  {fmt(inv.round_off)}
                </td>
              </tr>
            )}
            <tr style={{ borderTop: "2px solid #000" }}>
              <td
                colSpan={3}
                style={{
                  padding: "4px 8px",
                  fontWeight: "bold",
                  fontSize: "11px",
                }}
              >
                Total &nbsp;&nbsp;{" "}
                {items.reduce((s, i) => s + Number(i.qty || 0), 0).toFixed(2)}
              </td>
              <td
                colSpan={5}
                style={{
                  textAlign: "right",
                  padding: "4px 8px",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                ₹{fmt(inv.net_amount)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Amount in Words */}
        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          <div
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRight: "1px solid #000",
            }}
          >
            <div style={{ fontSize: "10px", color: "#555" }}>
              Amount Chargeable (in words)
            </div>
            <div
              style={{
                fontStyle: "italic",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {numberToWords(Number(inv.net_amount))}
            </div>
          </div>
          <div
            style={{
              width: "200px",
              textAlign: "right",
              padding: "6px 8px",
              fontWeight: "bold",
              fontSize: "20px",
            }}
          >
            ₹ {fmt(inv.net_amount)}
          </div>
          <div
            style={{
              width: "80px",
              textAlign: "center",
              padding: "6px 4px",
              fontSize: "10px",
              borderLeft: "1px solid #000",
            }}
          >
            E. &amp; O.E.
          </div>
        </div>

        {/* HSN Tax Summary */}
        <div style={{ borderBottom: "1px solid #000" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f5f5f5",
                  borderBottom: "1px solid #ccc",
                }}
              >
                <th style={thStyle}>HSN/SAC</th>
                <th style={thStyle}>Taxable Value</th>
                <th style={thStyle}>CGST Rate</th>
                <th style={thStyle}>CGST Amount</th>
                <th style={thStyle}>SGST/UTGST Rate</th>
                <th style={thStyle}>SGST/UTGST Amount</th>
                <th style={thStyle}>Total Tax Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(
                items.reduce((acc, item) => {
                  const key = item.hsn || "N/A";
                  if (!acc[key]) acc[key] = { taxable: 0, cgst: 0, sgst: 0 };
                  acc[key].taxable += Number(item.taxable_amt || 0);
                  acc[key].cgst += Number(
                    item.cgst_amount ||
                      (item.taxable_amt * (inv.cgst_rate || 0)) / 100 ||
                      0,
                  );
                  acc[key].sgst += Number(
                    item.sgst_amount ||
                      (item.taxable_amt * (inv.sgst_rate || 0)) / 100 ||
                      0,
                  );
                  return acc;
                }, {}),
              ).map(([hsn, vals]) => (
                <tr key={hsn} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={tdCenter}>{hsn}</td>
                  <td style={tdRight}>{fmt(vals.taxable)}</td>
                  <td style={tdCenter}>{inv.cgst_rate}%</td>
                  <td style={tdRight}>
                    {fmt(vals.cgst || inv.cgst_amount / items.length)}
                  </td>
                  <td style={tdCenter}>{inv.sgst_rate}%</td>
                  <td style={tdRight}>
                    {fmt(vals.sgst || inv.sgst_amount / items.length)}
                  </td>
                  <td style={tdRight}>
                    {fmt(
                      (vals.cgst || Number(inv.cgst_amount)) +
                        (vals.sgst || Number(inv.sgst_amount)),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "1px solid #000", fontWeight: "bold" }}>
                <td style={tdCenter}>Total</td>
                <td style={tdRight}>{fmt(inv.subtotal)}</td>
                <td style={tdCenter}></td>
                <td style={tdRight}>{fmt(inv.cgst_amount)}</td>
                <td style={tdCenter}></td>
                <td style={tdRight}>{fmt(inv.sgst_amount)}</td>
                <td style={tdRight}>
                  {fmt(Number(inv.cgst_amount) + Number(inv.sgst_amount))}
                </td>
              </tr>
            </tfoot>
          </table>
          <div
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              fontStyle: "italic",
            }}
          >
            Tax Amount (in words):{" "}
            {numberToWords(Number(inv.cgst_amount) + Number(inv.sgst_amount))}
          </div>
        </div>

        {/* Bank Details + Declaration */}
        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          {inv.bank_name && (
            <div
              style={{
                flex: 1,
                padding: "8px",
                borderRight: "1px solid #000",
                fontSize: "11px",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                Company's Bank Details
              </div>
              <div>
                A/c Holder's Name : <strong>{inv.bank_holder_name}</strong>
              </div>
              <div>Bank Name : {inv.bank_name}</div>
              <div>A/C No. : {inv.bank_account_no}</div>
              <div>
                Branch &amp; IFS Code: {inv.bank_branch} &amp; {inv.bank_ifsc}
              </div>
              {inv.open_balance != null && (
                <div
                  style={{
                    marginTop: "6px",
                    borderTop: "1px dashed #ccc",
                    paddingTop: "6px",
                  }}
                >
                  <div>Open Balance: {fmt(inv.open_balance)}</div>
                  <div style={{ fontWeight: "bold" }}>
                    Closing Balance:{" "}
                    {fmt(Number(inv.open_balance) + Number(inv.net_amount))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{ flex: 1, padding: "8px", fontSize: "11px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
              Declaration:
            </div>
            <div>
              We declare that this invoice shows the actual price of the goods
              described and that all particulars are true and correct.
            </div>
            <div
              style={{
                textAlign: "right",
                marginTop: "20px",
                fontWeight: "bold",
              }}
            >
              for BIP FENCING CONTRACT WORK
            </div>
          </div>
        </div>

        {/* Signature Row */}
        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          <div
            style={{
              flex: 1,
              padding: "30px 8px 6px",
              fontSize: "11px",
              borderRight: "1px solid #000",
              textAlign: "center",
            }}
          >
            Receiver's Signature
          </div>
          <div
            style={{
              flex: 1,
              padding: "30px 8px 6px",
              fontSize: "11px",
              textAlign: "center",
            }}
          >
            Authorised Signatory
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            padding: "4px",
            fontSize: "10px",
            color: "#555",
          }}
        >
          This is a Computer Generated Invoice
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "4px 6px",
  textAlign: "center",
  borderRight: "1px solid #ccc",
  borderBottom: "1px solid #000",
  fontSize: "10px",
  fontWeight: "bold",
};
const tdStyle = {
  padding: "3px 6px",
  borderRight: "1px solid #eee",
  fontSize: "11px",
};
const tdCenter = { ...tdStyle, textAlign: "center" };
const tdRight = { ...tdStyle, textAlign: "right" };

// ── Main Component ────────────────────────────────────────────
export default function Clients() {
  const isAdmin = getRole()?.toLowerCase() === "admin";

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [clientDetail, setClientDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: "",
    payment_date: "",
    note: "",
  });
  const [payLoading, setPayLoading] = useState(false);

  const [viewInvoice, setViewInvoice] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "",
    gst: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/client.php");
      const data = await res.json();
      if (data.success) {
        setClients(data.clients);
        if (data.clients.length > 0 && !selected) setSelected(data.clients[0]);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (!selected) return;
    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const res = await apiFetch(`/client.php?client_id=${selected.id}`);
        const data = await res.json();
        if (data.success) setClientDetail(data);
      } catch (err) {
        console.error("Failed to fetch client detail:", err);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetail();
  }, [selected]);

  const handleViewInvoice = async (invoice_no) => {
    setViewLoading(true);
    try {
      const res = await apiFetch(`/client.php?invoice_no=${invoice_no}`);
      const data = await res.json();
      if (data.success) setViewInvoice(data.invoice);
    } catch (err) {
      console.error("Failed to fetch invoice:", err);
    } finally {
      setViewLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!payForm.amount || !payForm.payment_date)
      return alert("Amount and date required");
    setPayLoading(true);
    try {
      const res = await apiFetch("/client.php", {
        method: "POST",
        body: JSON.stringify({
          client_id: selected.id,
          ...payForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPayModal(false);
        setPayForm({ amount: "", payment_date: "", note: "" });
        fetchClients();
        setSelected((prev) => ({ ...prev }));
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPayLoading(false);
    }
  };

  // ── Edit client ───────────────────────────────────────────────
  const openEditModal = (e, client) => {
    e.stopPropagation();
    setSelected(client);
    setEditForm({
      name: client.name || "",
      phone: client.phone || "",
      address: client.address || "",
      gst: client.gst || "",
    });
    setShowEditModal(true);
  };

  const handleEditClient = async () => {
    if (!editForm.name) return alert("Name is required");
    setEditLoading(true);
    try {
     const res = await apiFetch("/client.php", {
       method: "PUT",
       body: JSON.stringify({
         client_id: selected.id,
         ...editForm,
       }),
     });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchClients();
        setSelected((prev) => ({ ...prev, ...editForm }));
      } else {
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete client ─────────────────────────────────────────────
  const openDeleteModal = (e, client) => {
    e.stopPropagation();
    setSelected(client);
    setShowDeleteModal(true);
  };

  const handleDeleteClient = async () => {
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`/client.php?client_id=${selected.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteModal(false);
        setSelected(null);
        fetchClients();
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const sendInvoiceWhatsApp = () => {
    if (!selected || !clientDetail) return;
    const phone = selected.phone?.replace(/\D/g, "");
    const invoiceList = (clientDetail.invoices || [])
      .map(
        (i) => `• ${i.invoice_no} | ${i.invoice_date} | ₹${fmt(i.net_amount)}`,
      )
      .join("\n");
    const text = encodeURIComponent(
      `Dear ${selected.name},\n\nHere are your invoice details:\n${invoiceList}\n\nTotal Billed: ₹${fmt(clientDetail.total_billed)}\n\nThank you,\nBIP Fencing`,
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  const sendPaymentReminder = () => {
    if (!selected || !clientDetail) return;
    const phone = selected.phone?.replace(/\D/g, "");
    const text = encodeURIComponent(
      `Dear ${selected.name},\n\nThis is a gentle payment reminder:\n\nTotal Billed: ₹${fmt(clientDetail.total_billed)}\nTotal Paid:   ₹${fmt(clientDetail.total_paid)}\nPending:      ₹${fmt(clientDetail.pending)}\n\nPlease clear the pending amount at your earliest convenience.\n\nThank you,\nBIP Fencing`,
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.gst?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q);
    const status = getStatusBadge(
      c.pending,
      c.total_billed,
    ).label.toLowerCase();
    const matchStatus = statusFilter ? status.includes(statusFilter) : true;
    return matchSearch && matchStatus;
  });

  const totalBilled = clients.reduce(
    (s, c) => s + Number(c.total_billed || 0),
    0,
  );
  const totalPaid = clients.reduce((s, c) => s + Number(c.total_paid || 0), 0);
  const totalPending = clients.reduce((s, c) => s + Number(c.pending || 0), 0);
  const paidPct = totalBilled ? Math.round((totalPaid / totalBilled) * 100) : 0;
  const overdueCount = clients.filter(
    (c) =>
      Number(c.pending) >= Number(c.total_billed) && Number(c.total_billed) > 0,
  ).length;

  if (viewInvoice)
    return (
      <TaxInvoiceView inv={viewInvoice} onBack={() => setViewInvoice(null)} />
    );

  return (
    <div
      className="container-fluid p-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      {/* ── Payment Modal ── */}
      {showPayModal && (
        <div
          className="modal show d-block"
          style={{ background: "rgba(0,0,0,0.45)", zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg">
              <div className="modal-header border-0">
                <h6 className="modal-title">
                  Record Payment — {selected?.name}
                </h6>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Amount (₹) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={payForm.amount}
                    onChange={(e) =>
                      setPayForm({ ...payForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Payment Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={payForm.payment_date}
                    onChange={(e) =>
                      setPayForm({ ...payForm, payment_date: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Note (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={payForm.note}
                    onChange={(e) =>
                      setPayForm({ ...payForm, note: e.target.value })
                    }
                    placeholder="e.g. UPI payment"
                  />
                </div>
                {clientDetail && (
                  <div className="bg-light rounded p-2 small">
                    <span className="text-muted">Pending: </span>
                    <strong className="text-danger">
                      ₹{fmt(clientDetail.pending)}
                    </strong>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowPayModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleRecordPayment}
                  disabled={payLoading}
                >
                  {payLoading ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Client Modal (Admin only) ── */}
      {showEditModal && (
        <div
          className="modal show d-block"
          style={{ background: "rgba(0,0,0,0.45)", zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg">
              <div className="modal-header border-0">
                <h6 className="modal-title">✏️ Edit Client</h6>
                <button
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">GST Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.gst}
                    onChange={(e) =>
                      setEditForm({ ...editForm, gst: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleEditClient}
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal (Admin only) ── */}
      {showDeleteModal && (
        <div
          className="modal show d-block"
          style={{ background: "rgba(0,0,0,0.45)", zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg">
              <div className="modal-header border-0">
                <h6 className="modal-title text-danger">🗑️ Delete Client</h6>
                <button
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-1">
                  Are you sure you want to delete{" "}
                  <strong>{selected?.name}</strong>?
                </p>
                <p className="small text-danger mb-0">
                  ⚠️ This will permanently delete the client and all associated
                  payment records.
                </p>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteClient}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Clients</h1>
          <p className="text-muted mb-0">
            Manage client accounts, payments and billing
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <p className="text-muted small mb-1">Total Clients</p>
              <h2 className="mb-0">{clients.length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <p className="text-muted small mb-1">Total Billed</p>
              <h2 className="mb-0">₹{fmt(totalBilled)}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <p className="text-muted small mb-1">Total Collected</p>
              <h2 className="mb-0 text-success">₹{fmt(totalPaid)}</h2>
              <div className="progress mt-1" style={{ height: "4px" }}>
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${paidPct}%` }}
                ></div>
              </div>
              <p className="small text-muted mt-1 mb-0">{paidPct}% collected</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <p className="text-muted small mb-1">Pending Amount</p>
              <h2 className="mb-0 text-danger">₹{fmt(totalPending)}</h2>
              <span className="badge bg-warning bg-opacity-10 text-warning">
                {overdueCount} fully unpaid
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row g-3">
        {/* Left – Client Directory */}
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h6 className="mb-0">Client Directory</h6>
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search name, phone, GST..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: "200px" }}
                />
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: "130px" }}
                >
                  <option value="">All Status</option>
                  <option value="paid">Fully Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            <div className="card-body p-0">
              {/* Table Header - Shows ACTIONS column only for admin */}
              <div
                className="d-flex align-items-center px-3 py-2 border-bottom bg-light"
                style={{
                  fontSize: "11px",
                  color: "#6c757d",
                  fontWeight: "600",
                }}
              >
                <div style={{ width: "40px", flexShrink: 0 }}></div>
                <div className="flex-grow-1 ms-3">CLIENT</div>
                <div style={{ width: "140px", textAlign: "right" }}>AMOUNT</div>
                <div style={{ width: "80px", textAlign: "center" }}>STATUS</div>
                {isAdmin && (
                  <div style={{ width: "80px", textAlign: "center" }}>
                    ACTIONS
                  </div>
                )}
              </div>

              <div style={{ maxHeight: "560px", overflowY: "auto" }}>
                {loading && (
                  <p className="text-center text-muted py-5">
                    Loading clients...
                  </p>
                )}
                {!loading && filtered.length === 0 && (
                  <p className="text-center text-muted py-5 mb-0">
                    No clients found.
                  </p>
                )}
                {filtered.map((client) => {
                  const badge = getStatusBadge(
                    client.pending,
                    client.total_billed,
                  );
                  const color = colorFor(client.id);
                  return (
                    <div
                      key={client.id}
                      onClick={() => {
                        setSelected(client);
                        setActiveTab("overview");
                      }}
                      className={`d-flex align-items-center p-3 border-bottom ${selected?.id === client.id ? "bg-light" : ""}`}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Avatar */}
                      <div
                        className={`rounded-circle bg-${color} bg-opacity-10 d-flex align-items-center justify-content-center me-3`}
                        style={{ width: "40px", height: "40px", flexShrink: 0 }}
                      >
                        <span className={`text-${color} fw-bold`}>
                          {getInitials(client.name)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-grow-1">
                        <p className="mb-0 fw-semibold">{client.name}</p>
                        <p className="small text-muted mb-0">
                          {client.phone}
                          {client.gst ? ` · GST: ${client.gst}` : ""}
                        </p>
                        <p className="small text-muted mb-0">
                          {client.address}
                        </p>
                      </div>

                      {/* Amounts */}
                      <div className="text-end me-3">
                        <p className="mb-0 small fw-semibold text-success">
                          ₹{fmt(client.total_paid)} paid
                        </p>
                        <p
                          className={`mb-0 small ${Number(client.pending) > 0 ? "text-danger" : "text-success"}`}
                        >
                          {Number(client.pending) > 0
                            ? `₹${fmt(client.pending)} pending`
                            : "Fully paid"}
                        </p>
                        <p className="mb-0 small text-muted">
                          {client.total_invoices} invoice
                          {client.total_invoices !== 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Status badge - shows for ALL users */}
                      <span
                        className={`badge ${badge.class} bg-opacity-10 text-${badge.class.replace("bg-", "")}`}
                        style={{ width: "80px", textAlign: "center" }}
                      >
                        {badge.label}
                      </span>

                      {/* Admin-only Edit / Delete - shows for ALL statuses (Unpaid, Partial, Fully Paid) when admin */}
                      {isAdmin && (
                        <div
                          className="d-flex gap-1 ms-2"
                          style={{ width: "80px", flexShrink: 0 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="btn btn-outline-primary btn-sm py-0 px-2"
                            style={{ fontSize: "11px" }}
                            title="Edit client"
                            onClick={(e) => openEditModal(e, client)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm py-0 px-2"
                            style={{ fontSize: "11px" }}
                            title="Delete client"
                            onClick={(e) => openDeleteModal(e, client)}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card-footer bg-white">
              <span className="small text-muted">
                Showing {filtered.length} of {clients.length} clients
              </span>
            </div>
          </div>
        </div>

        {/* Right – Client Details */}
        <div className="col-lg-4">
          {selected && (
            <div className="card shadow-sm mb-3">
              <div className="card-header bg-white d-flex align-items-center gap-3">
                <div
                  className={`rounded-circle bg-${colorFor(selected.id)} bg-opacity-10 d-flex align-items-center justify-content-center`}
                  style={{ width: "48px", height: "48px" }}
                >
                  <span
                    className={`text-${colorFor(selected.id)} fw-bold fs-5`}
                  >
                    {getInitials(selected.name)}
                  </span>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-0">{selected.name}</h6>
                  <p className="small text-muted mb-1">{selected.phone}</p>
                  <span
                    className={`badge ${getStatusBadge(selected.pending, selected.total_billed).class} bg-opacity-10 text-${getStatusBadge(selected.pending, selected.total_billed).class.replace("bg-", "")}`}
                  >
                    {
                      getStatusBadge(selected.pending, selected.total_billed)
                        .label
                    }
                  </span>
                </div>
                {/* Admin edit/delete in right panel header - also shows for all statuses */}
                {isAdmin && (
                  <div className="d-flex gap-1">
                    <button
                      className="btn btn-outline-primary btn-sm py-0 px-2"
                      title="Edit"
                      onClick={(e) => openEditModal(e, selected)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm py-0 px-2"
                      title="Delete"
                      onClick={(e) => openDeleteModal(e, selected)}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              <div className="card-body p-0">
                <ul
                  className="nav nav-tabs nav-fill"
                  style={{
                    padding: "0 12px",
                    borderBottom: "1px solid #dee2e6",
                  }}
                >
                  {["overview", "invoices", "payments"].map((tab) => (
                    <li className="nav-item" key={tab}>
                      <button
                        className={`nav-link ${activeTab === tab ? "active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                        style={{ fontSize: "13px", padding: "10px 0" }}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    </li>
                  ))}
                </ul>

                <div
                  style={{
                    padding: "16px",
                    maxHeight: "500px",
                    overflowY: "auto",
                  }}
                >
                  {detailLoading && (
                    <p className="text-center text-muted py-3">Loading...</p>
                  )}

                  {/* Overview Tab */}
                  {!detailLoading &&
                    activeTab === "overview" &&
                    clientDetail && (
                      <div>
                        <div className="row g-2 mb-3">
                          <div className="col-6">
                            <div className="bg-success bg-opacity-10 rounded p-3 text-center">
                              <p className="small text-success mb-0">Paid</p>
                              <h6 className="text-success mb-0">
                                ₹{fmt(clientDetail.total_paid)}
                              </h6>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="bg-danger bg-opacity-10 rounded p-3 text-center">
                              <p className="small text-danger mb-0">Pending</p>
                              <h6 className="text-danger mb-0">
                                ₹{fmt(clientDetail.pending)}
                              </h6>
                            </div>
                          </div>
                        </div>
                        <div className="border-top pt-3">
                          {[
                            [
                              "Total Billed",
                              `₹${fmt(clientDetail.total_billed)}`,
                            ],
                            ["Phone", selected.phone || "—"],
                            ["Address", selected.address || "—"],
                            ["GST", selected.gst || "—"],
                            [
                              "Last Invoice",
                              clientDetail.invoices?.[0]?.invoice_no || "—",
                            ],
                            [
                              "Last Invoice Date",
                              clientDetail.invoices?.[0]?.invoice_date || "—",
                            ],
                            [
                              "Client Since",
                              selected.created_at?.slice(0, 10) || "—",
                            ],
                          ].map(([key, value]) => (
                            <div
                              key={key}
                              className="d-flex justify-content-between py-2 border-bottom"
                            >
                              <span className="small text-muted">{key}</span>
                              <span className="small fw-medium text-end">
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                        <button
                          className="btn btn-primary btn-sm w-100 mt-3"
                          onClick={() => setShowPayModal(true)}
                        >
                          + Record Payment
                        </button>
                      </div>
                    )}

                  {/* Invoices Tab */}
                  {!detailLoading &&
                    activeTab === "invoices" &&
                    clientDetail && (
                      <div>
                        <p className="small text-muted mb-2">
                          All invoices for this client
                        </p>
                        {(clientDetail.invoices || []).length === 0 && (
                          <p className="text-muted small text-center py-3">
                            No invoices yet.
                          </p>
                        )}
                        {(clientDetail.invoices || []).map((inv) => (
                          <div
                            key={inv.id}
                            className="bg-light rounded p-2 mb-2"
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <p className="mb-0 small fw-semibold">
                                  {inv.invoice_no}
                                </p>
                                <p className="small text-muted mb-0">
                                  {inv.invoice_date}
                                </p>
                                {inv.payment_mode && (
                                  <span
                                    className="badge bg-info bg-opacity-10 text-info"
                                    style={{ fontSize: "10px" }}
                                  >
                                    {inv.payment_mode}
                                  </span>
                                )}
                              </div>
                              <div className="text-end">
                                <p className="mb-1 small fw-semibold text-success">
                                  ₹{fmt(inv.net_amount)}
                                </p>
                                <button
                                  className="btn btn-outline-primary btn-sm py-0 px-2"
                                  style={{ fontSize: "11px" }}
                                  onClick={() =>
                                    handleViewInvoice(inv.invoice_no)
                                  }
                                  disabled={viewLoading}
                                >
                                  {viewLoading ? "..." : "👁 View Bill"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Payments Tab */}
                  {!detailLoading &&
                    activeTab === "payments" &&
                    clientDetail && (
                      <div>
                        <p className="small text-muted mb-2">Payment history</p>
                        {(clientDetail.payments || []).length === 0 && (
                          <p className="text-muted small text-center py-3">
                            No payments recorded yet.
                          </p>
                        )}
                        {(clientDetail.payments || []).map((pay) => (
                          <div
                            key={pay.id}
                            className="bg-light rounded p-2 mb-2 d-flex justify-content-between"
                          >
                            <div>
                              <p className="mb-0 small fw-semibold text-success">
                                ₹{fmt(pay.amount)}
                              </p>
                              <p className="small text-muted mb-0">
                                {pay.payment_date}
                              </p>
                              {pay.note && (
                                <p className="small text-muted mb-0">
                                  {pay.note}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        <button
                          className="btn btn-primary btn-sm w-100 mt-2"
                          onClick={() => setShowPayModal(true)}
                        >
                          + Add Payment
                        </button>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h6 className="mb-0">Quick Actions</h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={sendInvoiceWhatsApp}
                  disabled={!selected}
                >
                  <i className="bi bi-whatsapp me-2"></i>Send Invoice
                </button>
                <button
                  className="btn btn-outline-warning btn-sm"
                  onClick={sendPaymentReminder}
                  disabled={!selected}
                >
                  <i className="bi bi-bell me-2"></i>Payment Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
