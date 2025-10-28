let 订阅路径 = "订阅路径";
let 伪装网页;
let 手动输入列表 = [];

// 关键词拆分
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

    // 处理手动输入列表
    if (env.TXT) {
      手动输入列表 = env.TXT.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes('#')) // 过滤空行和不符合格式的行
        .map(line => {
          const [地址, uuid] = line.split('#').map(item => item.trim());
          return { 地址, uuid };
        })
        .filter(item => item.地址 && item.uuid); // 确保地址和UUID都存在
    }

    const url = new URL(访问请求.url);
    const 路径配置 = this.获取路径配置();

    // 检查是否为正确路径
    if (!this.检查路径是否正确(url.pathname, 路径配置)) {
      return this.处理伪装网页(访问请求, url) || new Response(null, { status: 404 });
    }

    // 处理不同路径的响应
    const 节点信息 = 获取节点信息();
    return this.生成响应结果(url.pathname, 路径配置, 节点信息, 访问请求);
  },

  // 获取路径配置
  获取路径配置() {
    return {
      威图锐: `/${encodeURIComponent(订阅路径)}/${威图锐}`,
      科拉什: `/${encodeURIComponent(订阅路径)}/${科拉什}`,
      通用订阅: `/${encodeURIComponent(订阅路径)}`,
    };
  },

  // 检查路径是否正确
  检查路径是否正确(当前路径, 路径配置) {
    return 当前路径 === 路径配置.威图锐 ||
           当前路径 === 路径配置.科拉什 ||
           当前路径 === 路径配置.通用订阅;
  },

  // 处理伪装网页请求
  async 处理伪装网页(访问请求, url) {
    if (!伪装网页) return null;

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

      return await fetch(请求对象);
    } catch {
      console.error(`[伪装网页请求失败] 目标: ${伪装网页}, 路径: ${url.pathname}`);
      return new Response(null, { status: 404 });
    }
  },

  // 生成响应结果
  生成响应结果(当前路径, 路径配置, 节点信息, 访问请求) {
    if (当前路径 === 路径配置.威图锐) {
      return 威图锐配置文件(节点信息);
    } else if (当前路径 === 路径配置.科拉什) {
      return 科拉什配置文件(节点信息);
    } else if (当前路径 === 路径配置.通用订阅) {
      const 用户代理 = 访问请求.headers.get("User-Agent")?.toLowerCase() || "";
      const 配置生成器 = {
        [威图锐]: () => 威图锐配置文件(节点信息),
        [科拉什]: () => 科拉什配置文件(节点信息),
        tips: () => 提示界面(),
      };
      const 工具 = Object.keys(配置生成器).find(工具 => 用户代理.includes(工具));
      const 生成配置 = 配置生成器[工具 || "tips"];
      return 生成配置();
    }
    return new Response(null, { status: 404 });
  }
};

// 获取节点信息（核心去重逻辑：出现重复地址则全部移除）
function 获取节点信息() {
  let 所有节点信息 = [];
  
  // 添加从TXT获取的自定义节点
  手动输入列表.forEach(({地址, uuid}) => {
    所有节点信息.push({
      地址,
      uuid,
      节点名字: `节点-${所有节点信息.length + 1}`
    });
  });

  // 如果没有获取到任何节点信息，返回默认节点
  if (所有节点信息.length === 0) {
    return [{
      地址: "127.0.0.1",
      uuid: "00000000-0000-4000-8000-000000000000",
      节点名字: "没有可用节点"
    }];
  }

  // 统计地址出现次数
  const 地址出现次数 = new Map();
  所有节点信息.forEach(节点 => {
    地址出现次数.set(节点.地址, (地址出现次数.get(节点.地址) || 0) + 1);
  });

  // 过滤出只出现一次的地址（重复地址全部移除）
  const 去重节点信息 = [];
  所有节点信息.forEach(节点 => {
    if (地址出现次数.get(节点.地址) === 1) {
      // 重新编号节点名字
      节点.节点名字 = `节点-${去重节点信息.length + 1}`;
      去重节点信息.push(节点);
    }
  });

  // 如果去重后没有节点，返回默认节点
  return 去重节点信息.length > 0 ? 去重节点信息 : [{
    地址: "127.0.0.1",
    uuid: "00000000-0000-4000-8000-000000000000",
    节点名字: "没有可用节点"
  }];
}

// 生成提示界面
async function 提示界面() {
  const 提示界面内容 = `
<title>订阅-${订阅路径}</title>
<style>
  body {
    font-size: 25px;
    text-align: center;
  }
</style>
<strong>请把链接导入 ${科拉什} 或 ${威图锐}</strong>
`;

  return new Response(提示界面内容, {
    status: 200,
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}

// 生成威图锐配置文件
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

// 生成科拉什配置文件
function 科拉什配置文件(节点信息列表) {
  // 生成节点配置和代理配置
  const 生成节点配置 = (节点) => {
    const { 地址, uuid, 节点名字 } = 节点;
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
      proxyConfig: `    - ${节点名字}`
    };
  };

  const 节点配置列表 = 节点信息列表.map(生成节点配置);
  const 节点配置内容 = 节点配置列表.map(item => item.nodeConfig).join("\n");
  const 代理配置内容 = 节点配置列表.map(item => item.proxyConfig).join("\n");

  const 配置内容 = `
proxies:
${节点配置内容}

proxy-groups:
- name: 海外规则
  type: select
  proxies:
    - 延迟优选
    - 故障转移
    - DIRECT
    - REJECT
${代理配置内容}
- name: 国内规则
  type: select
  proxies:
    - DIRECT
    - 延迟优选
    - 故障转移
    - REJECT
${代理配置内容}
- name: 广告屏蔽
  type: select
  proxies:
    - REJECT
    - DIRECT
    - 延迟优选
    - 故障转移
${代理配置内容}
- name: 延迟优选
  type: url-test
  url: https://www.google.com/generate_204
  interval: 30
  tolerance: 50
  proxies:
${代理配置内容}
- name: 故障转移
  type: fallback
  url: https://www.google.com/generate_204
  interval: 30
  proxies:
${代理配置内容}

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