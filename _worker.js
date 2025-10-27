// 多订阅聚合配置
let 订阅路径 = "订阅路径";
let 伪装网页;
let 订阅链接列表 = [];

let 威图锐拆分_1 = "v2";
let 威图锐拆分_2 = "ray";
let 威图锐 = 威图锐拆分_1 + 威图锐拆分_2;

let 科拉什拆分_1 = "cla";
let 科拉什拆分_2 = "sh";
let 科拉什 = 科拉什拆分_1 + 科拉什拆分_2;

let 维列斯拆分_1 = "vl";
let 维列斯拆分_2 = "ess";
let 维列斯 = 维列斯拆分_1 + 维列斯拆分_2;

// 网页入口
export default {
  async fetch(访问请求, env) {
    订阅路径 = env.SUB_PATH ?? 订阅路径;
    伪装网页 = env.FAKE_WEB;
    
    // 处理订阅链接列表
    if (env.URL) {
      订阅链接列表 = env.URL.split('\n')
        .map(url => url.trim())
        .filter(url => url)
        .map(url => {
          if (!url.includes('http://') && !url.includes('https://')) {
            return `https://${url}`;
          }
          return url;
        })
        .filter((url, index, array) => array.indexOf(url) === index); // URL去重
    }

    const url = new URL(访问请求.url);
    const 读取我的请求标头 = 访问请求.headers.get("Upgrade");
    const WS请求 = 读取我的请求标头 == "websocket";

    const 路径配置 = {
      威图锐: `/${encodeURIComponent(订阅路径)}/${威图锐}`,
      科拉什: `/${encodeURIComponent(订阅路径)}/${科拉什}`,
      通用订阅: `/${encodeURIComponent(订阅路径)}`,
    };

    const 是正确路径 = url.pathname === 路径配置.威图锐 ||
                      url.pathname === 路径配置.科拉什 ||
                      url.pathname === 路径配置.通用订阅;

    if (!WS请求 && !是正确路径) {
      if (伪装网页) {
        try {
          const targetBase = 伪装网页.startsWith('https://')
            ? 伪装网页
            : `https://${伪装网页}`;

          const targetUrl = new URL(targetBase);
          targetUrl.pathname = url.pathname;
          targetUrl.search = url.search;

          const 请求对象 = new Request(targetUrl.toString(), {
            method: 访问请求.method,
            headers: 访问请求.headers,
            body: 访问请求.body,
          });

          const 响应对象 = await fetch(请求对象);
          return 响应对象;
        } catch {
          console.error(`[伪装网页请求失败] 目标: ${伪装网页}, 路径: ${url.pathname}`);
          return new Response(null, { status: 404 });
        }
      } else {
        return new Response(null, { status: 404 });
      }
    }

    if (!WS请求) {
      // 获取聚合节点信息
      const 聚合节点信息 = await 获取聚合节点信息();
      
      if (url.pathname === 路径配置.威图锐) {
        return 威图锐配置文件(聚合节点信息);
      }
      else if (url.pathname === 路径配置.科拉什) {
        return 科拉什配置文件(聚合节点信息);
      }
      else if (url.pathname === 路径配置.通用订阅) {
        const 用户代理 = 访问请求.headers.get("User-Agent")?.toLowerCase() || "";
        const 配置生成器 = {
          [威图锐]: () => 威图锐配置文件(聚合节点信息),
          [科拉什]: () => 科拉什配置文件(聚合节点信息),
          tips: () => 提示界面(),
        };
        const 工具 = Object.keys(配置生成器).find((工具) => 用户代理.includes(工具));
        const 生成配置 = 配置生成器[工具 || "tips"];
        return 生成配置();
      }
    }

    return new Response(null, { status: 404 });
  },
};

// 获取聚合节点信息
async function 获取聚合节点信息() {
  let 所有节点信息 = [];
  
  if (订阅链接列表.length === 0) {
    return [{
      地址: "127.0.0.1",
      uuid: "00000000-0000-4000-8000-000000000000",
      节点名字: "没有可用节点"
    }];
  }

  for (let i = 0; i < 订阅链接列表.length; i++) {
    const 订阅链接 = 订阅链接列表[i];
    try {
      const 响应 = await fetch(订阅链接, {
        headers: {
          'User-Agent': 'info'
        }
      });
      
      if (响应.ok) {
        const 响应文本 = await 响应.text();
        const 节点信息行 = 响应文本.split('\n')
          .map(line => line.trim())
          .filter(line => line && line.includes('#'));
        
        节点信息行.forEach((行, 索引) => {
          const [地址, uuid] = 行.split('#');
          if (地址 && uuid) {
            所有节点信息.push({
              地址: 地址.trim(),
              uuid: uuid.trim(),
              节点名字: `节点-${所有节点信息.length + 1}`
            });
          }
        });
      }
    } catch {
      console.error(`获取订阅失败: ${订阅链接}`);
    }
  }

  // 如果没有获取到任何节点信息，返回默认节点
  if (所有节点信息.length === 0) {
    return [{
      地址: "127.0.0.1",
      uuid: "00000000-0000-4000-8000-000000000000",
      节点名字: "没有可用节点"
    }];
  }

  // 基于地址去重，保留第一个出现的节点
  const 已见主机名 = new Set();
  const 去重节点信息 = [];
  
  所有节点信息.forEach((节点, 索引) => {
    if (!已见主机名.has(节点.地址)) {
      已见主机名.add(节点.地址);
      // 重新编号节点名字
      节点.节点名字 = `节点-${去重节点信息.length + 1}`;
      去重节点信息.push(节点);
    }
  });

  return 去重节点信息;
}

async function 提示界面() {
  const 提示界面 = `
<title>订阅-${订阅路径}</title>
<style>
  body {
    font-size: 25px;
    text-align: center;
  }
</style>
<strong>请把链接导入 ${科拉什} 或 ${威图锐}</strong>
`;

  return new Response(提示界面, {
    status: 200,
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}

function 威图锐配置文件(节点信息列表) {
  const 配置内容 = 节点信息列表
    .map(({ 地址, uuid, 节点名字 }) => {
      return `${维列斯}://${uuid}@${地址}:443?encryption=none&security=tls&sni=${地址}&fp=chrome&type=ws&host=${地址}#${节点名字}`;
    })
    .join("\n");

  return new Response(配置内容, {
    status: 200,
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  });
}

function 科拉什配置文件(节点信息列表) {
  const 生成节点 = (节点信息列表) => {
    return 节点信息列表.map(({ 地址, uuid, 节点名字 }) => {
      return {
        nodeConfig: `- name: ${节点名字}
  type: ${维列斯}
  server: ${地址}
  port: 443
  uuid: ${uuid}
  udp: true
  tls: true
  sni: ${地址}
  network: ws
  ws-opts:
    headers:
      Host: ${地址}
      User-Agent: Chrome`,
        proxyConfig: `    - ${节点名字}`,
      };
    });
  };

  const 节点配置 = 生成节点(节点信息列表)
    .map((node) => node.nodeConfig)
    .join("\n");
  const 代理配置 = 生成节点(节点信息列表)
    .map((node) => node.proxyConfig)
    .join("\n");

  const 配置内容 = `
proxies:
${节点配置}

proxy-groups:
- name: 海外规则
  type: select
  proxies:
    - 延迟优选
    - 故障转移
    - DIRECT
    - REJECT
${代理配置}
- name: 国内规则
  type: select
  proxies:
    - DIRECT
    - 延迟优选
    - 故障转移
    - REJECT
${代理配置}
- name: 广告屏蔽
  type: select
  proxies:
    - REJECT
    - DIRECT
    - 延迟优选
    - 故障转移
${代理配置}
- name: 延迟优选
  type: url-test
  url: https://www.google.com/generate_204
  interval: 30
  tolerance: 50
  proxies:
${代理配置}
- name: 故障转移
  type: fallback
  url: https://www.google.com/generate_204
  interval: 30
  proxies:
${代理配置}

rules:
  - GEOSITE,category-ads-all,广告屏蔽
  - GEOSITE,cn,国内规则
  - GEOIP,CN,国内规则,no-resolve
  - MATCH,海外规则
`;

  return new Response(配置内容, {
    status: 200,
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  });
}