import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET


BEDCA_ENDPOINT = "https://www.bedca.net/bdpub/procquery.php"


class BedcaClient:
    def __init__(self, endpoint=BEDCA_ENDPOINT, timeout=30, retries=3, backoff=1.0, rate_limit_ms=200):
        self.endpoint = endpoint
        self.timeout = timeout
        self.retries = retries
        self.backoff = backoff
        self.rate_limit_ms = rate_limit_ms
        self._next_request_time = 0.0

    def _apply_rate_limit(self):
        if self.rate_limit_ms <= 0:
            return
        now = time.monotonic()
        if now < self._next_request_time:
            time.sleep(self._next_request_time - now)
        self._next_request_time = time.monotonic() + (self.rate_limit_ms / 1000.0)

    def post_query(self, xml_body):
        payload = xml_body.encode("utf-8")
        headers = {"Content-Type": "text/xml"}
        req = urllib.request.Request(self.endpoint, data=payload, headers=headers, method="POST")

        for attempt in range(self.retries + 1):
            self._apply_rate_limit()
            try:
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    data = resp.read()
                return ET.fromstring(data)
            except urllib.error.HTTPError as exc:
                status = exc.code
                retryable = status == 429 or 500 <= status < 600
                if retryable and attempt < self.retries:
                    time.sleep(self.backoff * (2 ** attempt))
                    continue
                raise
            except urllib.error.URLError:
                if attempt < self.retries:
                    time.sleep(self.backoff * (2 ** attempt))
                    continue
                raise


def build_level_3_query():
    return (
        "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
        "<foodquery>"
        "  <type level=\"3\"/>"
        "  <selection>"
        "    <atribute name=\"fg_id\"/>"
        "    <atribute name=\"fg_ori_name\"/>"
        "    <atribute name=\"fg_eng_name\"/>"
        "  </selection>"
        "  <order ordtype=\"ASC\">"
        "    <atribute3 name=\"fg_id\"/>"
        "  </order>"
        "</foodquery>"
    )


def build_level_3f_query(foodgroup_id, origin):
    return (
        "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
        "<foodquery>"
        "  <type level=\"3f\"/>"
        "  <selection>"
        "    <atribute name=\"f_id\"/>"
        "    <atribute name=\"f_ori_name\"/>"
        "    <atribute name=\"f_eng_name\"/>"
        "  </selection>"
        "  <condition>"
        "    <cond1><atribute1 name=\"foodgroup_id\"/></cond1>"
        "    <relation type=\"EQUAL\"/>"
        f"    <cond3>{foodgroup_id}</cond3>"
        "  </condition>"
        "  <condition>"
        "    <cond1><atribute1 name=\"f_origen\"/></cond1>"
        "    <relation type=\"EQUAL\"/>"
        f"    <cond3>{origin}</cond3>"
        "  </condition>"
        "  <order ordtype=\"ASC\">"
        "    <atribute3 name=\"f_ori_name\"/>"
        "  </order>"
        "</foodquery>"
    )


def build_level_2_query(food_id):
    return (
        "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
        "<foodquery>"
        "  <type level=\"2\"/>"
        "  <selection>"
        "    <atribute name=\"f_id\"/>"
        "    <atribute name=\"f_ori_name\"/>"
        "    <atribute name=\"f_eng_name\"/>"
        "    <atribute name=\"edible_portion\"/>"
        "    <atribute name=\"f_origen\"/>"
        "    <atribute name=\"c_id\"/>"
        "    <atribute name=\"c_ori_name\"/>"
        "    <atribute name=\"eur_name\"/>"
        "    <atribute name=\"componentgroup_id\"/>"
        "    <atribute name=\"best_location\"/>"
        "    <atribute name=\"v_unit\"/>"
        "    <atribute name=\"moex\"/>"
        "    <atribute name=\"value_type\"/>"
        "  </selection>"
        "  <condition>"
        "    <cond1><atribute1 name=\"f_id\"/></cond1>"
        "    <relation type=\"EQUAL\"/>"
        f"    <cond3>{food_id}</cond3>"
        "  </condition>"
        "  <condition>"
        "    <cond1><atribute1 name=\"publico\"/></cond1>"
        "    <relation type=\"EQUAL\"/>"
        "    <cond3>1</cond3>"
        "  </condition>"
        "  <order ordtype=\"ASC\">"
        "    <atribute3 name=\"componentgroup_id\"/>"
        "  </order>"
        "</foodquery>"
    )
